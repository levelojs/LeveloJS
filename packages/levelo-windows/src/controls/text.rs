use crate::controls::ElementBounds;
use skia_safe::{Canvas, Color, Font, Paint, Point};

/// Text node rendered using skia
#[derive(Debug, Clone)]
pub struct SkiaText {
    pub id: u64,
    pub bounds: ElementBounds,
    pub text: String,
    pub color: Color,
    pub font_size: f32,
}

impl SkiaText {
    pub fn new(id: u64, text: &str, x: f32, y: f32, font_size: f32) -> Self {
        Self {
            id,
            bounds: ElementBounds::new(x, y, 0.0, font_size),
            text: text.to_string(),
            color: Color::from_rgb(33, 37, 41),
            font_size,
        }
    }

    /// Method for drawing text on a Skia canvas
    pub fn draw(&self, canvas: &Canvas, font: &Font) {
        let mut paint = Paint::default();
        paint.set_anti_alias(true);
        paint.set_color(self.color);

        canvas.draw_str(
            &self.text,
            Point::new(self.bounds.x, self.bounds.y),
            font,
            &paint
        );
    }
}
