use crate::style::UiNode;

#[derive(Debug, Clone)]
pub struct LayoutBox {
    pub id: u64,
    pub tag: String,
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub padding_x: f32,
    pub padding_y: f32,
    pub margin_y: f32,
    pub bg_color: Option<skia_safe::Color>,
    pub border_color: Option<skia_safe::Color>,
    pub border_width: f32,
    pub border_radius: f32,
    pub text: Option<String>,
    pub font_size: f32,
    pub text_color: skia_safe::Color,
    pub is_bold: bool,
    pub children: Vec<u64>,
}

pub fn resolve_layout_tree(nodes: &[UiNode], viewport_width: f32) -> Vec<LayoutBox> {
    nodes
        .iter()
        .map(|node| {
            let is_button = node.tag == "button";
            let is_h1 = node.tag == "h1";
            let is_h2 = node.tag == "h2";
            let is_p = node.tag == "p";

            // Default browser font-size
            let default_font_size = if is_h1 {
                32.0
            } else if is_h2 {
                24.0
            } else {
                16.0
            };

            // Default browser margin
            let default_margin_y = if is_h1 {
                21.0
            } else if is_h2 {
                19.0
            } else if is_p {
                16.0
            } else {
                0.0
            };

            // Default browser button padding
            let (default_pad_x, default_pad_y) = if is_button { (10.0, 6.0) } else { (0.0, 0.0) };

            // Default browser button border & background
            let default_bg = if is_button {
                Some(skia_safe::Color::from_rgb(239, 239, 239))
            } else {
                None
            };

            let default_border = if is_button {
                Some(skia_safe::Color::from_rgb(118, 118, 118))
            } else {
                None
            };

            let (btn_default_w, btn_default_h) = if is_button {
                (90.0, 26.0)
            } else {
                (viewport_width, 0.0)
            };

            LayoutBox {
                id: node.id,
                tag: node.tag.clone(),
                x: node.style.x.unwrap_or(0.0),
                y: node.style.y.unwrap_or(0.0),
                width: node.style.width.unwrap_or(btn_default_w),
                height: node.style.height.unwrap_or(btn_default_h),
                padding_x: default_pad_x,
                padding_y: default_pad_y,
                margin_y: default_margin_y,
                bg_color: node.style.background_color.or(default_bg),
                border_color: node.style.border_color.or(default_border),
                border_width: node
                    .style
                    .border_width
                    .unwrap_or(if is_button { 1.0 } else { 0.0 }),
                border_radius: node.style.border_radius.unwrap_or(if is_button {
                    3.0
                } else {
                    0.0
                }),
                text: node.text_content.clone(),
                font_size: node.style.font_size.unwrap_or(default_font_size),
                text_color: node.style.color.unwrap_or(skia_safe::Color::BLACK),
                is_bold: is_h1 || is_h2,
                children: node.children.clone(),
            }
        })
        .collect()
}
