// packages/levelo-windows/src/canvas.rs

use crate::layout::LayoutBox;
use skia_safe::textlayout::{FontCollection, ParagraphBuilder, ParagraphStyle, TextStyle};
use skia_safe::{
    surfaces, Color, FontMgr, Paint, PaintStyle, Point, RRect, Rect,
};

pub struct SkiaRenderer {
    font_collection: FontCollection,
}

impl SkiaRenderer {
    pub fn new() -> Self {
        let font_mgr = FontMgr::new();
        let mut font_collection = FontCollection::new();
        font_collection.set_default_font_manager(font_mgr, None);

        Self { font_collection }
    }

    pub fn render(&self, width: i32, height: i32, boxes: &[LayoutBox]) -> Option<Vec<u8>> {
        let mut surface = surfaces::raster_n32_premul((width, height))?;
        let canvas = surface.canvas();

        // Canvas default background
        canvas.clear(Color::WHITE);

        // Render each box independently as resolved by Taffy
        for b in boxes {
            // 1. Draw Background
            if b.width > 0.0 && b.height > 0.0 {
                if let Some(bg_color) = b.bg_color {
                    let mut paint = Paint::default();
                    paint.set_color(bg_color);
                    paint.set_anti_alias(true);

                    let rect = Rect::from_xywh(b.x, b.y, b.width, b.height);
                    if b.border_radius > 0.0 {
                        let rrect = RRect::new_rect_xy(rect, b.border_radius, b.border_radius);
                        canvas.draw_rrect(rrect, &paint);
                    } else {
                        canvas.draw_rect(rect, &paint);
                    }
                }

                // 2. Draw Border
                if let Some(border_color) = b.border_color {
                    if b.border_width > 0.0 {
                        let mut border_paint = Paint::default();
                        border_paint.set_color(border_color);
                        border_paint.set_style(PaintStyle::Stroke);
                        border_paint.set_stroke_width(b.border_width);
                        border_paint.set_anti_alias(true);

                        let rect = Rect::from_xywh(b.x, b.y, b.width, b.height);
                        if b.border_radius > 0.0 {
                            let rrect = RRect::new_rect_xy(rect, b.border_radius, b.border_radius);
                            canvas.draw_rrect(rrect, &border_paint);
                        } else {
                            canvas.draw_rect(rect, &border_paint);
                        }
                    }
                }
            }

            // 3. Draw Text
            if let Some(ref text) = b.text {
                let normalized: String = text.split_whitespace().collect::<Vec<_>>().join(" ");
                let trimmed = normalized.as_str();

                if !trimmed.is_empty() {
                    let mut text_style = TextStyle::new();
                    text_style.set_font_size(b.font_size);
                    text_style.set_color(b.text_color);

                    if b.is_bold {
                        text_style.set_font_style(skia_safe::FontStyle::bold());
                    }

                    // Fallback font chain
                    text_style.set_font_families(&[
                        "Times New Roman",
                        "Segoe UI",
                        "Nirmala UI",
                        "Vrinda",
                    ]);

                    let para_style = ParagraphStyle::new();
                    let mut builder = ParagraphBuilder::new(&para_style, &self.font_collection);
                    builder.push_style(&text_style);
                    builder.add_text(trimmed);

                    let mut paragraph = builder.build();
                    let max_width = if b.width > 0.0 { b.width } else { 800.0 };
                    paragraph.layout(max_width);

                    paragraph.paint(canvas, Point::new(b.x, b.y));
                }
            }
        }

        // Extract raw pixel buffer
        let mut pixels = vec![0u8; (width * height * 4) as usize];
        let info = skia_safe::ImageInfo::new(
            (width, height),
            skia_safe::ColorType::BGRA8888,
            skia_safe::AlphaType::Premul,
            None,
        );

        let row_bytes = (width * 4) as usize;
        if surface.read_pixels(&info, &mut pixels, row_bytes, (0, 0)) {
            Some(pixels)
        } else {
            None
        }
    }
}