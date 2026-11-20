// packages/levelo-windows/src/layout/style_mapper.rs
use crate::style::UiNode;
use taffy::prelude::*;

pub fn resolve_taffy_style(
    node: &UiNode,
    default_font_size: f32,
    viewport_height: f32,
    parent_is_button: bool,
    parent_has_align: bool,
) -> Style {
    let is_button = node.tag == "button";
    let is_text = node.tag == "text";

    let font_size = node.style.font_size.unwrap_or(default_font_size);
    let line_height = font_size * 1.35;

    // Default size per tag; an explicit width/height always wins
    let (default_w, default_h): (Dimension, Dimension) = (auto(), auto());

    let w_dim: Dimension = node.style.width.map(|w| length(w)).unwrap_or(default_w);
    let h_dim = if let Some(vh) = node.style.height_vh {
        length(viewport_height * (vh / 100.0))
    } else if let Some(h) = node.style.height {
        length(h)
    } else {
        default_h
    };

    // Browser default button padding: 1px 6px
    let (pad_x, pad_y) = if is_button { (6.0, 1.0) } else { (0.0, 0.0) };
    let border = if is_button {
        node.style.border_width.unwrap_or(1.0)
    } else {
        node.style.border_width.unwrap_or(0.0)
    };

    let flex_direction = match node.style.flex_direction.as_deref() {
        Some("row") => FlexDirection::Row,
        Some("column") => FlexDirection::Column,
        // Browser parity: an explicit display:flex defaults to row
        _ => {
            if is_button || node.style.display.as_deref() == Some("flex") {
                FlexDirection::Row
            } else {
                FlexDirection::Column
            }
        }
    };

    let align_items = match node.style.align_items.as_deref() {
        Some("center") => AlignItems::CENTER,
        Some("flex-start") | Some("start") => AlignItems::FLEX_START,
        Some("flex-end") | Some("end") => AlignItems::FLEX_END,
        Some("stretch") => AlignItems::STRETCH,
        _ => {
            if is_button {
                AlignItems::CENTER
            } else {
                AlignItems::NORMAL
            }
        }
    };

    let justify_content = match node.style.justify_content.as_deref() {
        Some("center") => JustifyContent::CENTER,
        Some("flex-start") | Some("start") => JustifyContent::FLEX_START,
        Some("flex-end") | Some("end") => JustifyContent::FLEX_END,
        Some("space-between") => JustifyContent::SPACE_BETWEEN,
        Some("space-around") => JustifyContent::SPACE_AROUND,
        Some("space-evenly") => JustifyContent::SPACE_EVENLY,
        _ => {
            if is_button {
                JustifyContent::CENTER
            } else {
                JustifyContent::NORMAL
            }
        }
    };

    let min_h_dim = if let Some(vh) = node.style.min_height_vh {
        length(viewport_height * (vh / 100.0))
    } else if let Some(mh) = node.style.min_height {
        length(mh)
    } else {
        auto()
    };

    let gap_val = node.style.gap.unwrap_or(0.0);

    Style {
        display: Display::Flex,
        flex_direction,
        align_items,
        justify_content,
        size: Size {
            width: w_dim,
            height: h_dim,
        },
        margin: Rect {
            top: length(node.style.margin_top.unwrap_or(0.0)),
            bottom: length(node.style.margin_bottom.unwrap_or(0.0)),
            left: length(node.style.margin_left.unwrap_or(0.0)),
            right: length(node.style.margin_right.unwrap_or(0.0)),
        },
        padding: Rect {
            top: length(node.style.padding_top.unwrap_or(pad_y)),
            bottom: length(node.style.padding_bottom.unwrap_or(pad_y)),
            left: length(node.style.padding_left.unwrap_or(pad_x)),
            right: length(node.style.padding_right.unwrap_or(pad_x)),
        },
        border: Rect {
            top: length(border),
            bottom: length(border),
            left: length(border),
            right: length(border),
        },

        // Browser parity: a button without explicit width shrinks to its content,
        // unless the parent set align-items explicitly
        align_self: if is_button && node.style.width.is_none() && !parent_has_align {
            Some(AlignItems::FLEX_START)
        } else {
            None
        },
        min_size: Size {
            width: auto(),
            height: min_h_dim,
        },
        gap: Size {
            width: length(gap_val),
            height: length(gap_val),
        },
        ..Default::default()
    }
}
