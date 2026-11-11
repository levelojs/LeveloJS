// packages/levelo-windows/src/layout/types.rs

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
    pub is_centered: bool,
    pub children: Vec<u64>,
}