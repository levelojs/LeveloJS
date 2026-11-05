use skia_safe::{Canvas, Color, Paint, Point, RRect, Rect, paint::Style};

/// Defines individual corner radii for the button
#[derive(Debug, Clone, Copy, Default)]
pub struct BorderRadius {
    pub top_left: f32,
    pub top_right: f32,
    pub bottom_right: f32,
    pub bottom_left: f32,
}

impl BorderRadius {
    pub fn all(radius: f32) -> Self {
        Self {
            top_left: radius,
            top_right: radius,
            bottom_right: radius,
            bottom_left: radius,
        }
    }
}

/// Defines internal spacing for button content
#[derive(Debug, Clone, Copy, Default)]
pub struct Padding {
    pub top: f32,
    pub right: f32,
    pub bottom: f32,
    pub left: f32,
}

impl Padding {
    pub fn symmetric(vertical: f32, horizontal: f32) -> Self {
        Self {
            top: vertical,
            right: horizontal,
            bottom: vertical,
            left: horizontal,
        }
    }
}

/// Represents a production-grade Skia-rendered Button container node
#[derive(Debug, Clone)]
pub struct SkiaButton {
    pub id: u64,
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub bg_color: Color,
    pub hover_bg_color: Color,
    pub active_bg_color: Color,
    pub border_color: Color,
    pub border_width: f32,
    pub border_radius: BorderRadius,
    pub padding: Padding,
    pub is_hovered: bool,
    pub is_pressed: bool,
    pub children: Vec<u64>,
}

impl SkiaButton {
    /// Creates a new button container with modern default styles
    pub fn new(id: u64, x: f32, y: f32, width: f32, height: f32) -> Self {
        Self {
            id,
            x,
            y,
            width,
            height,
            bg_color: Color::from_rgb(13, 110, 253),
            hover_bg_color: Color::from_rgb(11, 94, 215),
            active_bg_color: Color::from_rgb(10, 88, 202),
            border_color: Color::TRANSPARENT,
            border_width: 0.0,
            border_radius: BorderRadius::all(8.0),
            padding: Padding::symmetric(8.0, 16.0),
            is_hovered: false,
            is_pressed: false,
            children: Vec::new(),
        }
    }

    /// Appends a child node ID (e.g., text node, SVG icon, sub-container)
    pub fn append_child(&mut self, child_id: u64) {
        if !self.children.contains(&child_id) {
            self.children.push(child_id);
        }
    }

    /// Removes a child node ID from this container
    pub fn remove_child(&mut self, child_id: u64) {
        self.children.retain(|&id| id != child_id);
    }

    /// Checks if a given coordinate hits within the button boundary
    pub fn hit_test(&self, mx: f32, my: f32) -> bool {
        mx >= self.x && mx <= (self.x + self.width) && my >= self.y && my <= (self.y + self.height)
    }

    /// Renders the button container background, states, and border
    pub fn draw_container(&self, canvas: &Canvas) {
        let rect = Rect::from_xywh(self.x, self.y, self.width, self.height);

        // Build 4-corner radii for skia
        let radii = [
            Point::new(self.border_radius.top_left, self.border_radius.top_left),
            Point::new(self.border_radius.top_right, self.border_radius.top_right),
            Point::new(self.border_radius.bottom_right, self.border_radius.bottom_right),
            Point::new(self.border_radius.bottom_left, self.border_radius.bottom_left),
        ];

        let rrect = RRect::new_rect_radii(rect, &radii);

        let mut paint = Paint::default();
        paint.set_anti_alias(true);

        // Determine background color based on interaction states
        let current_bg = if self.is_pressed {
            self.active_bg_color
        } else if self.is_hovered {
            self.hover_bg_color
        } else {
            self.bg_color
        };

        // Draw container fill
        paint.set_style(Style::Fill);
        paint.set_color(current_bg);
        canvas.draw_rrect(rrect, &paint);

        // Draw optional border
        if self.border_width > 0.0 && self.border_color != Color::TRANSPARENT {
            paint.set_style(Style::Stroke);
            paint.set_stroke_width(self.border_width);
            paint.set_color(self.border_color);
            canvas.draw_rrect(rrect, &paint);
        }
    }
}
