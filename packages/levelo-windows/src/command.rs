// packages/levelo-windows/src/command.rs

use std::collections::HashMap;
use skia_safe::Color;
use crate::controls::UiNode;

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

    // 1. Create Header Text node
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

    // 2. Create Button Container node
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

    // 3. Create Child Text inside Button
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

    // 4. Attach Child Text to Button Container
    batch.push(Operation::AppendChild {
        parent: NodeId::new(101),
        child: NodeId::new(102),
    });

    batch
}

/// Helper function to parse hex colors like "#ffffff" or "#0d6efd"
fn parse_hex_color(hex: &str) -> Color {
    let clean = hex.trim_start_matches('#');
    if clean.len() == 6 {
        if let Ok(val) = u32::from_str_radix(clean, 16) {
            let r = ((val >> 16) & 0xFF) as u8;
            let g = ((val >> 8) & 0xFF) as u8;
            let b = (val & 0xFF) as u8;
            return Color::from_rgb(r, g, b);
        }
    }
    Color::BLACK
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
                        "x" => target.style.x = value.parse().ok(),
                        "y" => target.style.y = value.parse().ok(),
                        "width" => target.style.width = value.parse().ok(),
                        "height" => target.style.height = value.parse().ok(),
                        "font-size" => target.style.font_size = value.parse().ok(),
                        "border-radius" => target.style.border_radius = value.parse().ok(),
                        "border-width" => target.style.border_width = value.parse().ok(),
                        "background" | "background-color" => {
                            target.style.background_color = Some(parse_hex_color(value));
                        }
                        "color" => {
                            target.style.color = Some(parse_hex_color(value));
                        }
                        "border-color" => {
                            target.style.border_color = Some(parse_hex_color(value));
                        }
                        _ => {}
                    }
                }
            }
            _ => {}
        }
    }

    // Preserve paint order
    let mut result = Vec::new();
    for id in render_order {
        if let Some(node) = nodes.remove(&id) {
            result.push(node);
        }
    }
    result
}