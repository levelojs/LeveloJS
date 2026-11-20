// packages/levelo-windows/src/style.rs

use skia_safe::Color;

/// Unified, optional style structure matching browser-grade CSS properties
#[derive(Debug, Clone, Default)]
pub struct NodeStyle {
    // Layout & Geometry
    pub x: Option<f32>,
    pub y: Option<f32>,
    pub width: Option<f32>,
    pub height: Option<f32>,
    pub min_height: Option<f32>,
    pub min_height_vh: Option<f32>,

    // Flexbox
    pub display: Option<String>,
    pub flex_direction: Option<String>,
    pub align_items: Option<String>,
    pub justify_content: Option<String>,
    pub gap: Option<f32>,

    // Spacing
    pub padding_top: Option<f32>,
    pub padding_right: Option<f32>,
    pub padding_bottom: Option<f32>,
    pub padding_left: Option<f32>,
    pub margin_top: Option<f32>,
    pub margin_right: Option<f32>,
    pub margin_bottom: Option<f32>,
    pub margin_left: Option<f32>,

    // Appearance
    pub background_color: Option<Color>,
    pub border_color: Option<Color>,
    pub border_width: Option<f32>,
    pub border_radius: Option<f32>,
    pub opacity: Option<f32>,

    // Typography
    pub font_size: Option<f32>,
    pub font_weight: Option<String>,
    pub color: Option<Color>,
}

/// Universal UI Node replacing isolated element types
#[derive(Debug, Clone)]
pub struct UiNode {
    pub id: u64,
    pub tag: String,
    pub text_content: Option<String>,
    pub style: NodeStyle,
    pub children: Vec<u64>,
}

impl UiNode {
    pub fn new(id: u64, tag: impl Into<String>) -> Self {
        Self {
            id,
            tag: tag.into(),
            text_content: None,
            style: NodeStyle::default(),
            children: Vec::new(),
        }
    }
}