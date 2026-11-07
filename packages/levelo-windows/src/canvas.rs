// packages/levelo-windows/src/canvas.rs

use std::collections::{HashMap, HashSet};
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

    pub fn render(&self, width: i32, height: i32, nodes: &[LayoutBox]) -> Option<Vec<u8>> {
        let mut surface = surfaces::raster_n32_premul((width, height))?;
        let canvas = surface.canvas();

        // Canvas default background
        canvas.clear(Color::WHITE);

        let mut node_map: HashMap<u64, &LayoutBox> = HashMap::new();
        let mut child_ids: HashSet<u64> = HashSet::new();

        for node in nodes {
            println!(
                "[Canvas Draw] Node: <{}> | w: {}, h: {} | bg: {:?}, color: {:?}, font_size: {}",
                node.tag,
                node.width,
                node.height,
                node.bg_color,
                node.text_color,
                node.font_size
            );
            node_map.insert(node.id, node);
            for child_id in &node.children {
                child_ids.insert(*child_id);
            }
        }

        let root_nodes: Vec<&LayoutBox> = nodes
            .iter()
            .filter(|n| !child_ids.contains(&n.id))
            .collect();

        let mut auto_y = 20.0;
        let left_padding = 20.0;

        for root in root_nodes {
            let consumed_height = self.render_node(&canvas, root, left_padding, auto_y, &node_map, None);
            auto_y += consumed_height + root.margin_y.max(10.0);
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

    fn render_node(
        &self,
        canvas: &skia_safe::Canvas,
        node: &LayoutBox,
        parent_x: f32,
        parent_y: f32,
        node_map: &HashMap<u64, &LayoutBox>,
        parent_w: Option<f32>,
    ) -> f32 {
        let x = if node.x > 0.0 { node.x } else { parent_x };
        let y = if node.y > 0.0 { node.y } else { parent_y };
        let w = node.width;
        let h = node.height;

        // 1. Render background and border
        if w > 0.0 && h > 0.0 {
            if let Some(bg_color) = node.bg_color {
                let mut paint = Paint::default();
                paint.set_color(bg_color);
                paint.set_anti_alias(true);

                let radius = node.border_radius;
                let rect = Rect::from_xywh(x, y, w, h);

                if radius > 0.0 {
                    let rrect = RRect::new_rect_xy(rect, radius, radius);
                    canvas.draw_rrect(rrect, &paint);
                } else {
                    canvas.draw_rect(rect, &paint);
                }
            }

            if let Some(border_color) = node.border_color {
                if node.border_width > 0.0 {
                    let mut border_paint = Paint::default();
                    border_paint.set_color(border_color);
                    border_paint.set_style(PaintStyle::Stroke);
                    border_paint.set_stroke_width(node.border_width);
                    border_paint.set_anti_alias(true);

                    let radius = node.border_radius;
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

        // 2. Render text with font shaping and bold handling
        let mut text_height = 0.0;
        if let Some(ref text) = node.text {
            let normalized: String = text.split_whitespace().collect::<Vec<_>>().join(" ");
            let trimmed = normalized.as_str();

            if !trimmed.is_empty() {
                let mut text_style = TextStyle::new();
                text_style.set_font_size(node.font_size);
                text_style.set_color(node.text_color);

                if node.is_bold {
                    text_style.set_font_style(skia_safe::FontStyle::bold());
                }

                // Font fallback chain
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

                let available_w = if w > 0.0 { Some(w) } else { parent_w };
                let layout_width = match available_w {
                    Some(bound_w) => (bound_w - (node.padding_x * 2.0).max(16.0)).max(10.0),
                    None => 800.0,
                };

                paragraph.layout(layout_width);
                paragraph.paint(canvas, Point::new(x, y));

                text_height = paragraph.height();
            }
        }

        // 3. Overflow clipping
        let should_clip = (node.tag == "button" || w > 0.0) && w > 0.0 && h > 0.0;
        if should_clip {
            canvas.save();
            let rect = Rect::from_xywh(x, y, w, h);
            canvas.clip_rect(rect, None, true);
        }

        // 4. Render children recursively
        let mut child_offset_y = 0.0;
        let current_w = if w > 0.0 { Some(w) } else { parent_w };

        for child_id in &node.children {
            if let Some(child_node) = node_map.get(child_id) {
                let (target_x, target_y) = if node.tag == "button" && h > 0.0 {
                    (x + node.padding_x.max(8.0), y + node.padding_y.max(4.0))
                } else {
                    (x, y + child_offset_y)
                };

                let consumed = self.render_node(
                    canvas,
                    child_node,
                    target_x,
                    target_y,
                    node_map,
                    current_w,
                );
                child_offset_y += consumed + child_node.margin_y;
            }
        }

        if should_clip {
            canvas.restore();
        }

        if h > 0.0 {
            h
        } else if child_offset_y > 0.0 {
            child_offset_y
        } else {
            text_height
        }
    }
}