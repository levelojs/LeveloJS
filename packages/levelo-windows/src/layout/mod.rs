// packages/levelo-windows/src/layout/mod.rs

pub mod style_mapper;
pub mod types;

pub use types::LayoutBox;

use crate::style::UiNode;
use crate::text::{self, TextContext};
use std::collections::{HashMap, HashSet};
use taffy::prelude::*;

/// Bold coming from the node's own tag or style (inheritance is resolved separately)
fn own_bold(node: &UiNode) -> bool {
    matches!(
        node.tag.as_str(),
        "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "strong" | "bold"
    ) || matches!(
        node.style.font_weight.as_deref(),
        Some("bold") | Some("700")
    )
}

pub struct LayoutEngine;

impl LayoutEngine {
    pub fn compute(nodes: &[UiNode], viewport_width: f32, viewport_height: f32) -> Vec<LayoutBox> {
        let mut tree: TaffyTree<TextContext> = TaffyTree::new();
        let mut node_map: HashMap<u64, &UiNode> = HashMap::new();
        let mut child_ids: HashSet<u64> = HashSet::new();
        let mut parent_of: HashMap<u64, u64> = HashMap::new();
        let mut taffy_map: HashMap<u64, NodeId> = HashMap::new();

        for node in nodes {
            node_map.insert(node.id, node);
            for child_id in &node.children {
                child_ids.insert(*child_id);
                parent_of.insert(*child_id, node.id);
            }
        }

        // Bold is inherited and it changes text width, so resolve it before measuring.
        // `nodes` is in paint order (parents first), so one pass is enough.
        let mut bold_of: HashMap<u64, bool> = HashMap::new();
        for node in nodes {
            let inherited = parent_of
                .get(&node.id)
                .and_then(|p| bold_of.get(p))
                .copied()
                .unwrap_or(false);
            bold_of.insert(node.id, own_bold(node) || inherited);
        }

        // 1. Create Taffy nodes with style mappings
        for node in nodes {
            let default_font_size = match node.tag.as_str() {
                "h1" => 32.0,
                "h2" => 24.0,
                _ => 16.0,
            };

            let parent_is_button = parent_of
                .get(&node.id)
                .and_then(|p| node_map.get(p))
                .map(|p| p.tag == "button")
                .unwrap_or(false);

            let parent_has_align = parent_of
                .get(&node.id)
                .and_then(|p| node_map.get(p))
                .map(|p| p.style.align_items.is_some())
                .unwrap_or(false);

            let taffy_style = style_mapper::resolve_taffy_style(
                node,
                default_font_size,
                parent_is_button,
                parent_has_align,
            );

            let taffy_node = if node.tag == "text" {
                // Text leaves carry a context so Taffy can measure them with Skia
                let ctx = TextContext {
                    text: node.text_content.clone().unwrap_or_default(),
                    font_size: node.style.font_size.unwrap_or(default_font_size),
                    bold: bold_of.get(&node.id).copied().unwrap_or(false),
                };
                tree.new_leaf_with_context(taffy_style, ctx).unwrap()
            } else {
                tree.new_leaf(taffy_style).unwrap()
            };

            taffy_map.insert(node.id, taffy_node);
        }

        // 2. Establish hierarchy relationships in Taffy
        for node in nodes {
            if !node.children.is_empty() {
                let parent_taffy = taffy_map[&node.id];
                let children_taffy: Vec<NodeId> = node
                    .children
                    .iter()
                    .filter_map(|cid| taffy_map.get(cid).copied())
                    .collect();

                let _ = tree.set_children(parent_taffy, &children_taffy);
            }
        }

        // 3. Mount all root nodes under root viewport container
        let root_nodes: Vec<&UiNode> = nodes
            .iter()
            .filter(|n| !child_ids.contains(&n.id))
            .collect();

        let root_children: Vec<NodeId> = root_nodes
            .iter()
            .filter_map(|n| taffy_map.get(&n.id).copied())
            .collect();

        let root_viewport = tree
            .new_with_children(
                Style {
                    display: Display::Flex,
                    flex_direction: FlexDirection::Column,
                    size: Size {
                        width: length(viewport_width),
                        height: length(viewport_height),
                    },
                    ..Default::default()
                },
                &root_children,
            )
            .unwrap();

        // 4. Compute layout, measuring text leaves with Skia
        tree.compute_layout_with_measure(
            root_viewport,
            Size {
                width: AvailableSpace::Definite(viewport_width),
                height: AvailableSpace::Definite(viewport_height),
            },
            |inputs, _node_id, node_ctx, style| {
                taffy::compute_leaf_layout(
                    inputs,
                    style,
                    |_val, _basis| 0.0,
                    |known, available| match node_ctx {
                        Some(t) => text::measure(t, known, available),
                        None => Size::ZERO,
                    },
                )
            },
        )
        .unwrap();

        // 5. Build absolute RenderBox structures recursively
        let mut computed_boxes = Vec::new();
        let viewport_layout = tree.layout(root_viewport).unwrap();

        for root in &root_nodes {
            let root_taffy = taffy_map[&root.id];
            Self::collect_boxes(
                root.id,
                root_taffy,
                &tree,
                &node_map,
                &taffy_map,
                viewport_layout.location.x,
                viewport_layout.location.y,
                false,
                16.0,
                skia_safe::Color::BLACK,
                false,
                &mut computed_boxes,
            );
        }

        computed_boxes
    }

    fn collect_boxes(
        node_id: u64,
        taffy_id: NodeId,
        tree: &TaffyTree<TextContext>,
        node_map: &HashMap<u64, &UiNode>,
        taffy_map: &HashMap<u64, NodeId>,
        parent_abs_x: f32,
        parent_abs_y: f32,
        inherited_bold: bool,
        inherited_font_size: f32,
        inherited_color: skia_safe::Color,
        parent_is_button: bool,
        output: &mut Vec<LayoutBox>,
    ) {
        let node = match node_map.get(&node_id) {
            Some(n) => *n,
            None => return,
        };

        let layout = tree.layout(taffy_id).unwrap();
        let abs_x = parent_abs_x + layout.location.x;
        let abs_y = parent_abs_y + layout.location.y;

        let is_button = node.tag == "button";
        let is_centered = is_button || parent_is_button;
        let is_heading = matches!(node.tag.as_str(), "h1" | "h2" | "h3" | "h4" | "h5" | "h6");
        let is_bold_tag = matches!(node.tag.as_str(), "strong" | "bold");
        let has_bold_style = node.style.font_weight.as_deref() == Some("bold")
            || node.style.font_weight.as_deref() == Some("700");
        let current_is_bold = is_heading || is_bold_tag || has_bold_style || inherited_bold;

        let tag_font_size = if node.tag == "h1" {
            32.0
        } else if node.tag == "h2" {
            24.0
        } else if node.tag == "text" {
            inherited_font_size
        } else {
            16.0
        };

        let current_font_size = node.style.font_size.unwrap_or(tag_font_size);
        let current_color = node.style.color.unwrap_or(inherited_color);

        let default_bg = if is_button {
            Some(skia_safe::Color::from_rgb(239, 239, 239))
        } else {
            None
        };

        let default_border = if is_button {
            Some(skia_safe::Color::from_rgb(118, 118, 118))
        } else {
            None
        };

        output.push(LayoutBox {
            id: node.id,
            tag: node.tag.clone(),
            x: abs_x,
            y: abs_y,
            width: layout.size.width,
            height: layout.size.height,
            bg_color: node.style.background_color.or(default_bg),
            border_color: node.style.border_color.or(default_border),
            border_width: node
                .style
                .border_width
                .unwrap_or(if is_button { 1.0 } else { 0.0 }),
            border_radius: node
                .style
                .border_radius
                .unwrap_or(if is_button { 3.0 } else { 0.0 }),
            text: node.text_content.clone(),
            font_size: current_font_size,
            text_color: current_color,
            is_bold: current_is_bold,
            is_centered,
            children: node.children.clone(),
        });

        for child_id in &node.children {
            if let Some(child_taffy) = taffy_map.get(child_id) {
                Self::collect_boxes(
                    *child_id,
                    *child_taffy,
                    tree,
                    node_map,
                    taffy_map,
                    abs_x,
                    abs_y,
                    current_is_bold,
                    current_font_size,
                    current_color,
                    is_button,
                    output,
                );
            }
        }
    }
}
