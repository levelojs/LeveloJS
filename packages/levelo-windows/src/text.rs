// packages/levelo-windows/src/text.rs
use skia_safe::font_style::{Slant, Weight, Width};
use skia_safe::textlayout::{
    FontCollection, Paragraph, ParagraphBuilder, ParagraphStyle, TextAlign, TextStyle,
};
use skia_safe::{Color, FontMgr, FontStyle};
use taffy::prelude::{AvailableSpace, Size};

thread_local! {
    // One font collection shared by layout (measuring) and canvas (painting)
    static FONTS: FontCollection = {
        let mut fc = FontCollection::new();
        fc.set_default_font_manager(FontMgr::new(), None);
        fc
    };
}

/// Data attached to every text leaf so Taffy can measure it
#[derive(Debug, Clone)]
pub struct TextContext {
    pub text: String,
    pub font_size: f32,
    pub bold: bool,
}

pub fn normalize(text: &str) -> String {
    text.split_whitespace().collect::<Vec<_>>().join(" ")
}

pub fn build_paragraph(
    text: &str,
    font_size: f32,
    bold: bool,
    color: Color,
    centered: bool,
) -> Paragraph {
    FONTS.with(|fc| {
        let mut style = TextStyle::new();
        style.set_font_size(font_size);
        style.set_color(color);
        style.set_font_style(FontStyle::new(
            if bold { Weight::BOLD } else { Weight::NORMAL },
            Width::NORMAL,
            Slant::Upright,
        ));
        style.set_font_families(&["Times New Roman", "Segoe UI", "Nirmala UI", "Vrinda"]);

        let mut para_style = ParagraphStyle::new();
        if centered {
            para_style.set_text_align(TextAlign::Center);
        }

        let mut builder = ParagraphBuilder::new(&para_style, fc);
        builder.push_style(&style);
        builder.add_text(text);
        builder.build()
    })
}

/// Called by Taffy while solving layout
pub fn measure(
    ctx: &TextContext,
    known: Size<Option<f32>>,
    available: Size<AvailableSpace>,
) -> Size<f32> {
    let text = normalize(&ctx.text);
    if text.is_empty() {
        return Size::ZERO;
    }

    let mut para = build_paragraph(&text, ctx.font_size, ctx.bold, Color::BLACK, false);

    // Natural single-line size first
    para.layout(1.0e6);
    let natural_w = para.max_intrinsic_width().ceil();

    let width = match known.width {
        Some(w) => w,
        None => match available.width {
            AvailableSpace::Definite(w) => natural_w.min(w),
            AvailableSpace::MinContent => para.min_intrinsic_width().ceil(),
            AvailableSpace::MaxContent => natural_w,
        },
    };

    // Re-layout at the final width so wrapped height is correct
    if width < natural_w {
        para.layout(width);
    }

    Size {
        width,
        height: known.height.unwrap_or_else(|| para.height().ceil()),
    }
}