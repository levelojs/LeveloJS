// packages/levelo-windows/src/lib.rs
#![allow(dead_code)]

pub mod canvas;
pub mod command;
pub mod style;
pub mod layout;

use canvas::SkiaRenderer;
use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, RECT, WPARAM};
use windows::Win32::Graphics::Gdi::{
    BI_RGB, BITMAPINFO, BITMAPINFOHEADER, DIB_RGB_COLORS, SRCCOPY, StretchDIBits,
};
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::UI::WindowsAndMessaging::{
    CS_HREDRAW, CS_VREDRAW, CreateWindowExW, DefWindowProcW, DispatchMessageW, GetClientRect,
    GetMessageW, IDC_ARROW, LoadCursorW, MSG, PostQuitMessage, RegisterClassW, SW_SHOW, ShowWindow,
    TranslateMessage, WM_COMMAND, WM_DESTROY, WM_ERASEBKGND, WM_PAINT, WNDCLASSW,
    WS_OVERLAPPEDWINDOW,
};
use windows::core::{Result, w};

static mut RENDERER: Option<SkiaRenderer> = None;

unsafe extern "system" fn window_proc(
    hwnd: HWND,
    msg: u32,
    wparam: WPARAM,
    lparam: LPARAM,
) -> LRESULT {
    match msg {
        WM_COMMAND => {
            let control_id = (wparam.0 & 0xffff) as usize;
            println!(
                "LeveloJS Engine: Event received from Control ID -> {}",
                control_id
            );
            LRESULT(0)
        }
        WM_ERASEBKGND => LRESULT(1),
        WM_PAINT => {
            let mut ps = windows::Win32::Graphics::Gdi::PAINTSTRUCT::default();
            let hdc = unsafe { windows::Win32::Graphics::Gdi::BeginPaint(hwnd, &mut ps) };

            let mut rect = RECT::default();
            let _ = unsafe { GetClientRect(hwnd, &mut rect) };
            let width = rect.right - rect.left;
            let height = rect.bottom - rect.top;

            if width > 0 && height > 0 {
                let bin_candidates = [
                    "../dist-native/app.bin",
                    "../../playground/dist-native/app.bin",
                    "playground/dist-native/app.bin",
                    "dist-native/app.bin",
                    "app.bin",
                ];

                let batch = bin_candidates
                    .iter()
                    .find_map(|path| command::decode_binary_file(path).ok())
                    .unwrap_or_else(|| {
                        eprintln!(
                            "[Levelo Engine] Warning: app.bin not found, using fallback mock."
                        );
                        command::get_initial_operation_batch()
                    });

                let elements = command::build_scene_from_batch(&batch);
                let layout_tree = layout::resolve_layout_tree(&elements, width as f32);

                unsafe {
                    if let Some(ref renderer) = RENDERER {
                        if let Some(pixels) = renderer.render(width, height, &layout_tree) {
                            let mut bmi = BITMAPINFO {
                                bmiHeader: BITMAPINFOHEADER {
                                    biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                                    biWidth: width,
                                    biHeight: -height, // Top-down DIB
                                    biPlanes: 1,
                                    biBitCount: 32,
                                    biCompression: BI_RGB.0,
                                    ..Default::default()
                                },
                                ..Default::default()
                            };

                            let result = StretchDIBits(
                                hdc,
                                0,
                                0,
                                width,
                                height,
                                0,
                                0,
                                width,
                                height,
                                Some(pixels.as_ptr() as *const _),
                                &mut bmi,
                                DIB_RGB_COLORS,
                                SRCCOPY,
                            );

                            if result == 0 {
                                eprintln!(
                                    "[Levelo Engine] GDI StretchDIBits failed to blit surface."
                                );
                            }
                        }
                    }
                }
            }

            let _ = unsafe { windows::Win32::Graphics::Gdi::EndPaint(hwnd, &ps) };
            LRESULT(0)
        }

        WM_DESTROY => {
            unsafe { PostQuitMessage(0) };
            LRESULT(0)
        }
        _ => unsafe { DefWindowProcW(hwnd, msg, wparam, lparam) },
    }
}

/// Public API: Starts the Levelo Native Windows Host
pub fn run_engine(title: &str, width: i32, height: i32) -> Result<()> {
    unsafe {
        RENDERER = Some(SkiaRenderer::new());

        let instance = GetModuleHandleW(None)?;
        let class_name = w!("LeveloWindowsEngine");

        let wc = WNDCLASSW {
            style: CS_HREDRAW | CS_VREDRAW,
            lpfnWndProc: Some(window_proc),
            hInstance: instance.into(),
            lpszClassName: class_name,
            hbrBackground: Default::default(), // কোনো GDI ব্যাকগ্রাউন্ড ব্রাশ রাখব না
            hCursor: LoadCursorW(None, IDC_ARROW).unwrap_or_default(),
            ..Default::default()
        };

        RegisterClassW(&wc);

        let title_wide: Vec<u16> = title.encode_utf16().chain(std::iter::once(0)).collect();

        let main_hwnd = CreateWindowExW(
            Default::default(),
            class_name,
            windows::core::PCWSTR(title_wide.as_ptr()),
            WS_OVERLAPPEDWINDOW,
            100,
            100,
            width,
            height,
            None,
            None,
            Some(instance.into()),
            None,
        )?;

        let _ = ShowWindow(main_hwnd, SW_SHOW);

        let mut msg = MSG::default();
        while GetMessageW(&mut msg, None, 0, 0).as_bool() {
            let _ = TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }
    }

    Ok(())
}
