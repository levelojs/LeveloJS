use crate::controls::{SkiaButton, SkiaText};

/// A structure for maintaining the position and size of each element
#[derive(Debug, Clone, Copy, Default)]
pub struct ElementBounds {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

impl ElementBounds {
    pub fn new(x: f32, y: f32, width: f32, height: f32) -> Self {
        Self { x, y, width, height }
    }

    /// A method to verify whether the mouse pointer is inside the box of this element.
    pub fn hit_test(&self, mx: f32, my: f32) -> bool {
        mx >= self.x && mx <= (self.x + self.width) && my >= self.y && my <= (self.y + self.height)
    }
}

/// Element Type
#[derive(Debug, Clone)]
pub enum UiElement {
    Button(SkiaButton),
    Text(SkiaText)
}