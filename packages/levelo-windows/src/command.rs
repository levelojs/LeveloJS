// packages/levelo-windows/src/command.rs

use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::Path;
use skia_safe::Color;
use crate::style::UiNode;

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

/// Operation classification matching levelo-core
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum OperationType {
    CreateElement,
    CreateText,
    AppendChild,
    InsertBefore,
    ReplaceChild,
    RemoveChild,
    DeleteNode,
    SetProperty,
    RemoveProperty,
    SetStyle,
    RemoveStyle,
    SetText,
    AddEventListener,
    RemoveEventListener,
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
    DeleteNode {
        node: NodeId,
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
            Self::AppendChild { .. } => OperationType::AppendChild,
            Self::InsertBefore { .. } => OperationType::InsertBefore,
            Self::ReplaceChild { .. } => OperationType::ReplaceChild,
            Self::RemoveChild { .. } => OperationType::RemoveChild,
            Self::DeleteNode { .. } => OperationType::DeleteNode,
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

/// Initial mock operations mimicking levelo-core renderer output
pub fn get_initial_operation_batch() -> OperationBatch {
    let mut batch = OperationBatch::new();

    batch.push(Operation::CreateText {
        node: NodeId::new(1),
        text: "Levelo Skia Canvas Test from Siam, Do you ready?".to_string(),
    });
    batch.push(Operation::SetStyle {
        node: NodeId::new(1),
        name: "x".to_string(),
        value: "50".to_string(),
    });
    batch.push(Operation::SetStyle {
        node: NodeId::new(1),
        name: "y".to_string(),
        value: "50".to_string(),
    });
    batch.push(Operation::SetStyle {
        node: NodeId::new(1),
        name: "font-size".to_string(),
        value: "22".to_string(),
    });

    batch.push(Operation::CreateElement {
        node: NodeId::new(101),
        element_type: "button".to_string(),
    });
    batch.push(Operation::SetStyle {
        node: NodeId::new(101),
        name: "x".to_string(),
        value: "50".to_string(),
    });
    batch.push(Operation::SetStyle {
        node: NodeId::new(101),
        name: "y".to_string(),
        value: "90".to_string(),
    });
    batch.push(Operation::SetStyle {
        node: NodeId::new(101),
        name: "width".to_string(),
        value: "150".to_string(),
    });
    batch.push(Operation::SetStyle {
        node: NodeId::new(101),
        name: "height".to_string(),
        value: "44".to_string(),
    });
    batch.push(Operation::SetStyle {
        node: NodeId::new(101),
        name: "border-radius".to_string(),
        value: "8".to_string(),
    });
    batch.push(Operation::SetStyle {
        node: NodeId::new(101),
        name: "background".to_string(),
        value: "#0d6efd".to_string(),
    });

    batch.push(Operation::CreateText {
        node: NodeId::new(102),
        text: "Click Here".to_string(),
    });
    batch.push(Operation::SetStyle {
        node: NodeId::new(102),
        name: "x".to_string(),
        value: "85".to_string(),
    });
    batch.push(Operation::SetStyle {
        node: NodeId::new(102),
        name: "y".to_string(),
        value: "103".to_string(),
    });
    batch.push(Operation::SetStyle {
        node: NodeId::new(102),
        name: "font-size".to_string(),
        value: "15".to_string(),
    });
    batch.push(Operation::SetStyle {
        node: NodeId::new(102),
        name: "color".to_string(),
        value: "#ffffff".to_string(),
    });

    batch.push(Operation::AppendChild {
        parent: NodeId::new(101),
        child: NodeId::new(102),
    });

    batch
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
        "transparent" => return Color::TRANSPARENT,
        _ => {}
    }

    let clean = value.trim_start_matches('#');

    // Expand shorthand "#abc" into "#aabbcc"
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

/// Constructs a unified UiNode scene tree from raw operation batch
pub fn build_scene_from_batch(batch: &OperationBatch) -> Vec<UiNode> {
    let mut nodes: HashMap<u64, UiNode> = HashMap::new();
    let mut render_order: Vec<u64> = Vec::new();

    for op in batch.iter() {
        match op {
            Operation::CreateElement { node, element_type } => {
                nodes.insert(node.0, UiNode::new(node.0, element_type));
                render_order.push(node.0);
            }
            Operation::CreateText { node, text } => {
                let mut ui_node = UiNode::new(node.0, "text");
                ui_node.text_content = Some(text.clone());
                nodes.insert(node.0, ui_node);
                render_order.push(node.0);
            }
            Operation::AppendChild { parent, child } => {
                if let Some(parent_node) = nodes.get_mut(&parent.0) {
                    parent_node.children.push(child.0);
                }
            }
            Operation::SetText { node, text } => {
                if let Some(target) = nodes.get_mut(&node.0) {
                    target.text_content = Some(text.clone());
                }
            }
            Operation::SetStyle { node, name, value } => {
                if let Some(target) = nodes.get_mut(&node.0) {
                    match name.as_str() {
                        "x" => target.style.x = parse_px(value),
                        "y" => target.style.y = parse_px(value),
                        "width" => target.style.width = parse_px(value),
                        "height" => target.style.height = parse_px(value),
                        "font-size" => target.style.font_size = parse_px(value),
                        "border-radius" => target.style.border_radius = parse_px(value),
                        "border-width" => target.style.border_width = parse_px(value),
                        "background" | "background-color" => {
                            target.style.background_color = Some(parse_color(value));
                        }
                        "color" => {
                            target.style.color = Some(parse_color(value));
                        }
                        "border-color" => {
                            target.style.border_color = Some(parse_color(value));
                        }
                        _ => {}
                    }
                }
            }
            _ => {}
        }
    }

    // Roots are nodes that never appear as a child of another node.
    // JSX evaluates children before parents, so creation order is not paint order.
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

    // Safety net: nodes whose parent was never created still get painted
    for id in &render_order {
        collect_in_paint_order(*id, &mut nodes, &mut result, None, None);
    }

    result
}

/// Reads raw `.bin` payload and reconstructs the universal OperationBatch
pub fn decode_binary_file<P: AsRef<Path>>(path: P) -> std::io::Result<OperationBatch> {
    let bytes = fs::read(path)?;
    let mut batch = OperationBatch::new();
    let mut offset = 0;

    while offset < bytes.len() {
        let opcode = bytes[offset];
        offset += 1;

        match opcode {
            0x01 => {
                if offset + 10 > bytes.len() { break; }
                let node = u64::from_le_bytes(bytes[offset..offset + 8].try_into().unwrap());
                offset += 8;
                let len = u16::from_le_bytes(bytes[offset..offset + 2].try_into().unwrap()) as usize;
                offset += 2;
                if offset + len > bytes.len() { break; }
                let tag = String::from_utf8_lossy(&bytes[offset..offset + len]).to_string();
                offset += len;

                batch.push(Operation::CreateElement {
                    node: NodeId::new(node),
                    element_type: tag,
                });
            }
            0x02 => {
                if offset + 10 > bytes.len() { break; }
                let node = u64::from_le_bytes(bytes[offset..offset + 8].try_into().unwrap());
                offset += 8;
                let len = u16::from_le_bytes(bytes[offset..offset + 2].try_into().unwrap()) as usize;
                offset += 2;
                if offset + len > bytes.len() { break; }
                let text = String::from_utf8_lossy(&bytes[offset..offset + len]).to_string();
                offset += len;

                batch.push(Operation::CreateText {
                    node: NodeId::new(node),
                    text,
                });
            }
            0x03 => {
                if offset + 16 > bytes.len() { break; }
                let parent = u64::from_le_bytes(bytes[offset..offset + 8].try_into().unwrap());
                offset += 8;
                let child = u64::from_le_bytes(bytes[offset..offset + 8].try_into().unwrap());
                offset += 8;

                batch.push(Operation::AppendChild {
                    parent: NodeId::new(parent),
                    child: NodeId::new(child),
                });
            }
            0x04 => {
                if offset + 11 > bytes.len() { break; }
                let node = u64::from_le_bytes(bytes[offset..offset + 8].try_into().unwrap());
                offset += 8;
                let key_id = bytes[offset];
                offset += 1;
                let len = u16::from_le_bytes(bytes[offset..offset + 2].try_into().unwrap()) as usize;
                offset += 2;
                if offset + len > bytes.len() { break; }
                let val = String::from_utf8_lossy(&bytes[offset..offset + len]).to_string();
                offset += len;

                let key_name = match key_id {
                    1 => "x",
                    2 => "y",
                    3 => "width",
                    4 => "height",
                    5 => "font-size",
                    6 => "border-radius",
                    7 => "border-width",
                    8 => "background",
                    9 => "color",
                    10 => "border-color",
                    _ => continue,
                };

                batch.push(Operation::SetStyle {
                    node: NodeId::new(node),
                    name: key_name.to_string(),
                    value: val,
                });
            }
            0x05 => {
                if offset + 17 > bytes.len() { break; }
                let node = u64::from_le_bytes(bytes[offset..offset + 8].try_into().unwrap());
                offset += 8;
                let event_id = bytes[offset];
                offset += 1;
                let listener_id = u64::from_le_bytes(bytes[offset..offset + 8].try_into().unwrap());
                offset += 8;

                let event_name = match event_id {
                    1 => "click",
                    2 => "mousedown",
                    3 => "mouseup",
                    4 => "input",
                    _ => "unknown",
                };

                batch.push(Operation::AddEventListener {
                    node: NodeId::new(node),
                    event: event_name.to_string(),
                    listener_id,
                });
            }
            _ => break,
        }
    }

    Ok(batch)
}