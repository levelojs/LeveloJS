// packages/levelo-windows/src/layout.rs

use crate::style::UiNode;
use std::collections::{HashMap, HashSet};
use taffy::prelude::*;

#[derive(Debug, Clone)]
pub struct LayoutBox {
    pub id: u64,
    pub tag: String,
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub bg_color: Option<skia_safe::Color>,
    pub border_color: Option<skia_safe::Color>,
    pub border_width: f32,
    pub border_radius: f32,
    pub text: Option<String>,
    pub font_size: f32,
    pub text_color: skia_safe::Color,
    pub is_bold: bool,
    pub children: Vec<u64>,
}

pub struct LayoutEngine;

impl LayoutEngine {
    pub fn compute(nodes: &[UiNode], viewport_width: f32, viewport_height: f32) -> Vec<LayoutBox> {
        let mut tree: TaffyTree<()> = TaffyTree::new();
        let mut node_map: HashMap<u64, &UiNode> = HashMap::new();
        let mut child_ids: HashSet<u64> = HashSet::new();
        let mut taffy_map: HashMap<u64, NodeId> = HashMap::new();

        for node in nodes {
            node_map.insert(node.id, node);
            for child_id in &node.children {
                child_ids.insert(*child_id);
            }
        }

        // 1. Create Taffy nodes with style mappings
        for node in nodes {
            let is_button = node.tag == "button";
            let is_h1 = node.tag == "h1";
            let is_h2 = node.tag == "h2";
            let is_p = node.tag == "p";

            // Default browser font sizes
            let default_font_size = if is_h1 {
                32.0
            } else if is_h2 {
                24.0
            } else {
                16.0
            };

            let font_size = node.style.font_size.unwrap_or(default_font_size);

            // Default browser margin mapping (symmetric vertical block margins)
            let default_margin_y = if is_h1 {
                21.0
            } else if is_h2 {
                19.0
            } else if is_p {
                16.0
            } else {
                0.0
            };

            // Calculate intrinsic height for text/headings so Taffy does not collapse height to zero
            let line_height = font_size * 1.35;
            let has_text = node.text_content.is_some()
                || matches!(
                    node.tag.as_str(),
                    "h1" | "h2" | "h3" | "p" | "strong" | "text"
                );

            // Width and Height resolution
            let (w_dim, h_dim) = if let (Some(w), Some(h)) = (node.style.width, node.style.height) {
                (length(w), length(h))
            } else if is_button {
                // Resolve text length either from direct content or from child text nodes
                let direct_len = node.text_content.as_deref().unwrap_or("").chars().count();
                let child_text_len = node
                    .children
                    .iter()
                    .filter_map(|cid| node_map.get(cid))
                    .filter_map(|cn| cn.text_content.as_deref())
                    .map(|t| t.chars().count())
                    .sum::<usize>();

                let total_chars = direct_len.max(child_text_len).max(4);
                let est_char_width = font_size * 0.62;
                let auto_width = (total_chars as f32 * est_char_width) + 32.0;
                let auto_height = font_size + 14.0;

                (length(auto_width), length(auto_height))
            } else if matches!(node.tag.as_str(), "div" | "section" | "main" | "header") {
                (percent(1.0), auto())
            } else if has_text {
                (percent(1.0), length(line_height))
            } else {
                (auto(), auto())
            };

            // Browser button default horizontal and vertical padding
            let (pad_x, pad_y) = if is_button { (12.0, 4.0) } else { (0.0, 0.0) };

            let taffy_style = Style {
                display: Display::Flex,
                flex_direction: FlexDirection::Column,
                size: Size {
                    width: w_dim,
                    height: h_dim,
                },
                margin: Rect {
                    top: length(node.style.margin_top.unwrap_or(default_margin_y)),
                    bottom: length(node.style.margin_bottom.unwrap_or(default_margin_y)),
                    left: length(node.style.margin_left.unwrap_or(0.0)),
                    right: length(node.style.margin_right.unwrap_or(0.0)),
                },
                padding: Rect {
                    top: length(node.style.padding_top.unwrap_or(pad_y)),
                    bottom: length(node.style.padding_bottom.unwrap_or(pad_y)),
                    left: length(node.style.padding_left.unwrap_or(pad_x)),
                    right: length(node.style.padding_right.unwrap_or(pad_x)),
                },
                ..Default::default()
            };

            let taffy_node = tree.new_leaf(taffy_style).unwrap();
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

        // 3. Mount all root nodes under an invisible root viewport container
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
                    padding: Rect {
                        top: length(20.0),
                        left: length(20.0),
                        bottom: length(20.0),
                        right: length(20.0),
                    },
                    ..Default::default()
                },
                &root_children,
            )
            .unwrap();

        // 4. Compute layout through Taffy solver
        tree.compute_layout(
            root_viewport,
            Size {
                width: AvailableSpace::Definite(viewport_width),
                height: AvailableSpace::Definite(viewport_height),
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
                &mut computed_boxes,
            );
        }

        computed_boxes
    }

    fn collect_boxes(
        node_id: u64,
        taffy_id: NodeId,
        tree: &TaffyTree<()>,
        node_map: &HashMap<u64, &UiNode>,
        taffy_map: &HashMap<u64, NodeId>,
        parent_abs_x: f32,
        parent_abs_y: f32,
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
        let is_h1 = node.tag == "h1";
        let is_h2 = node.tag == "h2";

        let default_font_size = if is_h1 {
            32.0
        } else if is_h2 {
            24.0
        } else {
            16.0
        };

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
            font_size: node.style.font_size.unwrap_or(default_font_size),
            text_color: node.style.color.unwrap_or(skia_safe::Color::BLACK),
            is_bold: is_h1 || is_h2,
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
                    output,
                );
            }
        }
    }
}