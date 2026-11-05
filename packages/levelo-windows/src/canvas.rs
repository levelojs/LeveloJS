// packages/levelo-windows/src/canvas.rs

use crate::controls::UiNode;
use skia_safe::{
    surfaces, Color, Font, FontMgr, FontStyle, Paint, PaintStyle, Rect, RRect, Typeface,
};

pub struct SkiaRenderer {
    typeface: Typeface,
}

impl SkiaRenderer {
    pub fn new() -> Self {
        let font_mgr = FontMgr::new();

        // 1. Try Windows standard system font "Segoe UI", fallback to "Arial"
        let typeface = font_mgr
            .match_family_style("Segoe UI", FontStyle::normal())
            .or_else(|| font_mgr.match_family_style("Arial", FontStyle::normal()))
            .or_else(|| font_mgr.legacy_make_typeface(None, FontStyle::normal()))
            .expect("Levelo Engine: Critical error - No system font available");

        Self { typeface }
    }

    pub fn render(&self, width: i32, height: i32, nodes: &[UiNode]) -> Option<Vec<u8>> {
        let mut surface = surfaces::raster_n32_premul((width, height))?;
        let canvas = surface.canvas();

        // Clear canvas background to white
        canvas.clear(Color::WHITE);

        for node in nodes {
            let x = node.style.x.unwrap_or(0.0);
            let y = node.style.y.unwrap_or(0.0);
            let w = node.style.width.unwrap_or(0.0);
            let h = node.style.height.unwrap_or(0.0);

            // 1. Render background and border
            if w > 0.0 && h > 0.0 {
                if let Some(bg_color) = node.style.background_color {
                    let mut paint = Paint::default();
                    paint.set_color(bg_color);
                    paint.set_anti_alias(true);

                    let radius = node.style.border_radius.unwrap_or(0.0);
                    let rect = Rect::from_xywh(x, y, w, h);

                    if radius > 0.0 {
                        let rrect = RRect::new_rect_xy(rect, radius, radius);
                        canvas.draw_rrect(rrect, &paint);
                    } else {
                        canvas.draw_rect(rect, &paint);
                    }
                }

                if let (Some(border_color), Some(border_width)) =
                    (node.style.border_color, node.style.border_width)
                {
                    if border_width > 0.0 {
                        let mut border_paint = Paint::default();
                        border_paint.set_color(border_color);
                        border_paint.set_style(PaintStyle::Stroke);
                        border_paint.set_stroke_width(border_width);
                        border_paint.set_anti_alias(true);

                        let radius = node.style.border_radius.unwrap_or(0.0);
                        let rect = Rect::from_xywh(x, y, w, h);

                        if radius > 0.0 {
                            let rrect = RRect::new_rect_xy(rect, radius, radius);
                            canvas.draw_rrect(rrect, &border_paint);
                        } else {
                            canvas.draw_rect(rect, &border_paint);
                        }
                    }
                }
            }

            // 2. Render text content
            if let Some(ref text) = node.text_content {
                let font_size = node.style.font_size.unwrap_or(14.0);
                let font = Font::new(self.typeface.clone(), font_size);

                let mut text_paint = Paint::default();
                text_paint.set_color(node.style.color.unwrap_or(Color::BLACK));
                text_paint.set_anti_alias(true);

                canvas.draw_str(text, (x, y + font_size), &font, &text_paint);
            }
        }

        // 3. Extract raw pixel buffer from surface
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