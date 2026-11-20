// packages/levelo-windows/src/command.rs
use crate::style::UiNode;
use skia_safe::Color;
use std::collections::{HashMap, HashSet};

/// Represents a unique DOM node ID matching levelo-core
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct NodeId(pub u64);

impl NodeId {
    pub const fn new(id: u64) -> Self {
        Self(id)
    }
}

/// Generic value type for node properties
#[derive(Debug, Clone, PartialEq)]
pub enum Value {
    String(String),
    Number(f64),
    Bool(bool),
}

/// Operation classification matching NativeOpCode in levelojs (1 to 14)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum OperationType {
    CreateElement = 1,
    CreateText = 2,
    AppendChild = 3,
    InsertBefore = 4,
    ReplaceChild = 5,
    RemoveChild = 6,
    DeleteNode = 7,
    SetProperty = 8,
    RemoveProperty = 9,
    SetStyle = 10,
    RemoveStyle = 11,
    SetText = 12,
    AddEventListener = 13,
    RemoveEventListener = 14,
}

/// Exact operations dispatched from levelo-core
#[derive(Debug, Clone, PartialEq)]
pub enum Operation {
    CreateElement {
        node: NodeId,
        element_type: String,
    },
    CreateText {
        node: NodeId,
        text: String,
    },
    DeleteNode {
        node: NodeId,
    },
    AppendChild {
        parent: NodeId,
        child: NodeId,
    },
    InsertBefore {
        parent: NodeId,
        child: NodeId,
        reference: NodeId,
    },
    ReplaceChild {
        parent: NodeId,
        new_child: NodeId,
        old_child: NodeId,
    },
    RemoveChild {
        parent: NodeId,
        child: NodeId,
    },
    SetProperty {
        node: NodeId,
        name: String,
        value: Value,
    },
    RemoveProperty {
        node: NodeId,
        name: String,
    },
    SetStyle {
        node: NodeId,
        name: String,
        value: String,
    },
    RemoveStyle {
        node: NodeId,
        name: String,
    },
    SetText {
        node: NodeId,
        text: String,
    },
    AddEventListener {
        node: NodeId,
        event: String,
        listener_id: u64,
    },
    RemoveEventListener {
        node: NodeId,
        event: String,
        listener_id: u64,
    },
}

impl Operation {
    pub fn kind(&self) -> OperationType {
        match self {
            Self::CreateElement { .. } => OperationType::CreateElement,
            Self::CreateText { .. } => OperationType::CreateText,
            Self::DeleteNode { .. } => OperationType::DeleteNode,
            Self::AppendChild { .. } => OperationType::AppendChild,
            Self::InsertBefore { .. } => OperationType::InsertBefore,
            Self::ReplaceChild { .. } => OperationType::ReplaceChild,
            Self::RemoveChild { .. } => OperationType::RemoveChild,
            Self::SetProperty { .. } => OperationType::SetProperty,
            Self::RemoveProperty { .. } => OperationType::RemoveProperty,
            Self::SetStyle { .. } => OperationType::SetStyle,
            Self::RemoveStyle { .. } => OperationType::RemoveStyle,
            Self::SetText { .. } => OperationType::SetText,
            Self::AddEventListener { .. } => OperationType::AddEventListener,
            Self::RemoveEventListener { .. } => OperationType::RemoveEventListener,
        }
    }
}

/// Batch container for operations
#[derive(Debug, Clone, Default, PartialEq)]
pub struct OperationBatch {
    operations: Vec<Operation>,
}

impl OperationBatch {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_capacity(capacity: usize) -> Self {
        Self {
            operations: Vec::with_capacity(capacity),
        }
    }

    pub fn push(&mut self, operation: Operation) {
        self.operations.push(operation);
    }

    pub fn len(&self) -> usize {
        self.operations.len()
    }

    pub fn is_empty(&self) -> bool {
        self.operations.is_empty()
    }

    pub fn iter(&self) -> impl Iterator<Item = &Operation> {
        self.operations.iter()
    }

    pub fn into_operations(self) -> Vec<Operation> {
        self.operations
    }

    pub fn clear(&mut self) {
        self.operations.clear();
    }
}

impl IntoIterator for OperationBatch {
    type Item = Operation;
    type IntoIter = std::vec::IntoIter<Operation>;

    fn into_iter(self) -> Self::IntoIter {
        self.operations.into_iter()
    }
}

/// Parses a numeric style value, accepting an optional "px" suffix ("20" or "20px")
fn parse_px(value: &str) -> Option<f32> {
    value
        .trim()
        .trim_end_matches("px")
        .trim()
        .parse::<f32>()
        .ok()
}

// Parse vh value
fn parse_vh(value: &str) -> Option<f32> {
    let v = value.trim();
    v.strip_suffix("vh")?.trim().parse::<f32>().ok()
}

/// Parses 1, 2, 3, or 4 value CSS box shorthand ("20px", "10px 16px", "10px 20px 30px 40px")
/// Returns (top, right, bottom, left)
fn parse_box_shorthand(value: &str) -> Option<(f32, f32, f32, f32)> {
    let parts: Vec<f32> = value
        .split_whitespace()
        .filter_map(parse_px)
        .collect();

    match parts.len() {
        1 => Some((parts[0], parts[0], parts[0], parts[0])),
        2 => Some((parts[0], parts[1], parts[0], parts[1])),
        3 => Some((parts[0], parts[1], parts[2], parts[1])),
        4 => Some((parts[0], parts[1], parts[2], parts[3])),
        _ => None,
    }
}

/// Parses CSS border shorthand like "1px solid #1f2937" or "none"
fn parse_border_shorthand(value: &str) -> (Option<f32>, Option<Color>) {
    let trimmed = value.trim();
    if trimmed.eq_ignore_ascii_case("none") || trimmed == "0" {
        return (Some(0.0), Some(Color::TRANSPARENT));
    }

    let mut width = None;
    let mut color = None;

    for token in trimmed.split_whitespace() {
        if matches!(
            token.to_lowercase().as_str(),
            "solid" | "dashed" | "dotted" | "double" | "groove" | "ridge" | "inset" | "outset"
        ) {
            continue;
        }
        if width.is_none() {
            if let Some(w) = parse_px(token) {
                width = Some(w);
                continue;
            }
        }
        if color.is_none() {
            color = Some(parse_color(token));
        }
    }

    (width, color)
}

/// Parses "#rrggbb", "#rgb" and a few common color names
fn parse_color(input: &str) -> Color {
    let value = input.trim().to_lowercase();

    match value.as_str() {
        "white" => return Color::WHITE,
        "black" => return Color::BLACK,
        "red" => return Color::RED,
        "green" => return Color::GREEN,
        "blue" => return Color::BLUE,
        "gray" | "grey" => return Color::GRAY,
        "yellow" => return Color::YELLOW,
        "cyan" | "aqua" => return Color::CYAN,
        "magenta" | "fuchsia" => return Color::MAGENTA,
        "transparent" => return Color::TRANSPARENT,
        _ => {}
    }

    let clean = value.trim_start_matches('#');
    let expanded: String = if clean.len() == 3 {
        clean.chars().flat_map(|c| [c, c]).collect()
    } else {
        clean.to_string()
    };

    if expanded.len() == 6 {
        if let Ok(val) = u32::from_str_radix(&expanded, 16) {
            let r = ((val >> 16) & 0xFF) as u8;
            let g = ((val >> 8) & 0xFF) as u8;
            let b = (val & 0xFF) as u8;
            return Color::from_rgb(r, g, b);
        }
    }

    Color::BLACK
}

/// Default font sizes roughly matching the browser user-agent stylesheet
fn default_font_size(tag: &str) -> Option<f32> {
    match tag {
        "h1" => Some(32.0),
        "h2" => Some(24.0),
        "h3" => Some(18.7),
        "h4" => Some(16.0),
        "h5" => Some(13.3),
        "h6" => Some(10.7),
        "small" => Some(13.0),
        _ => None,
    }
}

/// Pushes a node, then its children depth-first, applying default styles and inheritance
fn collect_in_paint_order(
    id: u64,
    nodes: &mut HashMap<u64, UiNode>,
    out: &mut Vec<UiNode>,
    inherited_font_size: Option<f32>,
    inherited_color: Option<Color>,
) {
    if let Some(mut node) = nodes.remove(&id) {
        if node.style.font_size.is_none() {
            node.style.font_size = default_font_size(&node.tag).or(inherited_font_size);
        }
        if node.style.color.is_none() {
            node.style.color = inherited_color;
        }

        let font_size = node.style.font_size;
        let color = node.style.color;
        let children = node.children.clone();
        out.push(node);

        for child_id in children {
            collect_in_paint_order(child_id, nodes, out, font_size, color);
        }
    }
}

// Remove item when it calls to remove it
fn remove_subtree(
    id: u64,
    nodes: &mut HashMap<u64, UiNode>,
    render_order: &mut Vec<u64>,
) {
    let children = nodes
        .remove(&id)
        .map(|n| n.children)
        .unwrap_or_default();

    render_order.retain(|&node_id| node_id != id);

    for child_id in children {
        remove_subtree(child_id, nodes, render_order);
    }
}

/// Dynamic fallback / error overlay screen
pub fn get_initial_operation_batch(error_msg: Option<&str>) -> OperationBatch {
    let mut batch = OperationBatch::new();

    let message = error_msg.unwrap_or("Waiting for LeveloJS Native Bundle...");

    // Background Card
    batch.push(Operation::CreateElement {
        node: NodeId::new(990),
        element_type: "div".to_string(),
    });
    batch.push(Operation::SetStyle {
        node: NodeId::new(990),
        name: "x".to_string(),
        value: "30".to_string(),
    });
    batch.push(Operation::SetStyle {
        node: NodeId::new(990),
        name: "y".to_string(),
        value: "30".to_string(),
    });
    batch.push(Operation::SetStyle {
        node: NodeId::new(990),
        name: "background".to_string(),
        value: "#1e1e2e".to_string(),
    });
    batch.push(Operation::SetStyle {
        node: NodeId::new(990),
        name: "border-radius".to_string(),
        value: "8".to_string(),
    });

    // Error / Status Text
    batch.push(Operation::CreateText {
        node: NodeId::new(991),
        text: format!("[Levelo Engine Error]: {}", message),
    });
    batch.push(Operation::SetStyle {
        node: NodeId::new(991),
        name: "x".to_string(),
        value: "45".to_string(),
    });
    batch.push(Operation::SetStyle {
        node: NodeId::new(991),
        name: "y".to_string(),
        value: "50".to_string(),
    });
    batch.push(Operation::SetStyle {
        node: NodeId::new(991),
        name: "font-size".to_string(),
        value: "16".to_string(),
    });
    batch.push(Operation::SetStyle {
        node: NodeId::new(991),
        name: "color".to_string(),
        value: "#ff5555".to_string(),
    });

    batch.push(Operation::AppendChild {
        parent: NodeId::new(990),
        child: NodeId::new(991),
    });

    batch
}

/// Constructs a unified UiNode scene tree from raw operation batch
pub fn build_scene_from_batch(batch: &OperationBatch) -> Vec<UiNode> {
    let mut nodes: HashMap<u64, UiNode> = HashMap::new();
    let mut render_order: Vec<u64> = Vec::new();

    for op in batch.iter() {
        match op {
            Operation::CreateElement { node, element_type } => {
                nodes.insert(node.0, UiNode::new(node.0, element_type));
                render_order.retain(|&id| id != node.0);
                render_order.push(node.0);
            }
            Operation::CreateText { node, text } => {
                let mut ui_node = UiNode::new(node.0, "text");
                ui_node.text_content = Some(text.clone());
                nodes.insert(node.0, ui_node);
                render_order.retain(|&id| id != node.0);
                render_order.push(node.0);
            }
            Operation::DeleteNode { node } => {
                remove_subtree(node.0, &mut nodes, &mut render_order);
            }
            Operation::AppendChild { parent, child } => {
                if let Some(parent_node) = nodes.get_mut(&parent.0) {
                    parent_node.children.retain(|&c| c != child.0);
                    parent_node.children.push(child.0);
                }
            }
            Operation::InsertBefore {
                parent,
                child,
                reference,
            } => {
                if let Some(parent_node) = nodes.get_mut(&parent.0) {
                    parent_node.children.retain(|&c| c != child.0);
                    if let Some(pos) = parent_node.children.iter().position(|&c| c == reference.0) {
                        parent_node.children.insert(pos, child.0);
                    } else {
                        parent_node.children.push(child.0);
                    }
                }
            }
            Operation::ReplaceChild {
                parent,
                new_child,
                old_child,
            } => {
                if let Some(parent_node) = nodes.get_mut(&parent.0) {
                    if let Some(pos) = parent_node.children.iter().position(|&c| c == old_child.0) {
                        parent_node.children[pos] = new_child.0;
                    } else {
                        parent_node.children.push(new_child.0);
                    }
                }
                remove_subtree(old_child.0, &mut nodes, &mut render_order);
            }
            Operation::RemoveChild { parent, child } => {
                if let Some(parent_node) = nodes.get_mut(&parent.0) {
                    parent_node.children.retain(|&c| c != child.0);
                }
                remove_subtree(child.0, &mut nodes, &mut render_order);
            }
            Operation::SetText { node, text } => {
                if let Some(target) = nodes.get_mut(&node.0) {
                    target.text_content = Some(text.clone());
                }
            }
            Operation::SetProperty { node, name, value } => {
                if let Some(target) = nodes.get_mut(&node.0) {
                    // For example: target.attributes.insert(name.clone(), value.clone());
                    let _ = (target, name, value);
                }
            }
            Operation::RemoveProperty { node, name } => {
                if let Some(target) = nodes.get_mut(&node.0) {
                    let _ = (target, name);
                }
            }
            Operation::SetStyle { node, name, value } => {
                if let Some(target) = nodes.get_mut(&node.0) {
                    match name.as_str() {
                        "x" => target.style.x = parse_px(value),
                        "y" => target.style.y = parse_px(value),
                        "width" => target.style.width = parse_px(value),
                        "height" => {
                            if let Some(vh) = parse_vh(value) {
                                target.style.height_vh = Some(vh);
                                target.style.height = None;
                            } else {
                                target.style.height = parse_px(value);
                                target.style.height_vh = None;
                            }
                        }
                        "min-height" => {
                            if let Some(vh) = parse_vh(value) {
                                target.style.min_height_vh = Some(vh);
                                target.style.min_height = None;
                            } else {
                                target.style.min_height = parse_px(value);
                                target.style.min_height_vh = None;
                            }
                        }
                        "font-size" => target.style.font_size = parse_px(value),
                        "font-weight" => target.style.font_weight = Some(value.clone()),
                        "border-radius" => target.style.border_radius = parse_px(value),
                        "border-width" => target.style.border_width = parse_px(value),
                        "border-color" => {
                            target.style.border_color = Some(parse_color(value));
                        }
                        "border" => {
                            let (w, c) = parse_border_shorthand(value);
                            if let Some(bw) = w {
                                target.style.border_width = Some(bw);
                            }
                            if let Some(bc) = c {
                                target.style.border_color = Some(bc);
                            }
                        }
                        "background" | "background-color" => {
                            target.style.background_color = Some(parse_color(value));
                        }
                        "color" => {
                            target.style.color = Some(parse_color(value));
                        }
                        "display" => target.style.display = Some(value.clone()),
                        "flex-direction" => target.style.flex_direction = Some(value.clone()),
                        "align-items" => target.style.align_items = Some(value.clone()),
                        "justify-content" => target.style.justify_content = Some(value.clone()),
                        "gap" => target.style.gap = parse_px(value),
                        "padding" => {
                            if let Some((t, r, b, l)) = parse_box_shorthand(value) {
                                target.style.padding_top = Some(t);
                                target.style.padding_right = Some(r);
                                target.style.padding_bottom = Some(b);
                                target.style.padding_left = Some(l);
                            }
                        }
                        "padding-top" => target.style.padding_top = parse_px(value),
                        "padding-bottom" => target.style.padding_bottom = parse_px(value),
                        "padding-left" => target.style.padding_left = parse_px(value),
                        "padding-right" => target.style.padding_right = parse_px(value),
                        "margin" => {
                            if let Some((t, r, b, l)) = parse_box_shorthand(value) {
                                target.style.margin_top = Some(t);
                                target.style.margin_right = Some(r);
                                target.style.margin_bottom = Some(b);
                                target.style.margin_left = Some(l);
                            }
                        }
                        "margin-top" => target.style.margin_top = parse_px(value),
                        "margin-bottom" => target.style.margin_bottom = parse_px(value),
                        "margin-left" => target.style.margin_left = parse_px(value),
                        "margin-right" => target.style.margin_right = parse_px(value),
                        _ => {}
                    }
                }
            }
            Operation::RemoveStyle { node, name } => {
                if let Some(target) = nodes.get_mut(&node.0) {
                    match name.as_str() {
                        "background" | "background-color" => target.style.background_color = None,
                        "color" => target.style.color = None,
                        _ => {}
                    }
                }
            }
            Operation::AddEventListener { .. } | Operation::RemoveEventListener { .. } => {}
        }
    }

    let child_ids: HashSet<u64> = nodes
        .values()
        .flat_map(|n| n.children.iter().copied())
        .collect();

    let mut result = Vec::with_capacity(nodes.len());

    for id in &render_order {
        if !child_ids.contains(id) {
            collect_in_paint_order(*id, &mut nodes, &mut result, None, None);
        }
    }

    for id in &render_order {
        collect_in_paint_order(*id, &mut nodes, &mut result, None, None);
    }

    result
}
