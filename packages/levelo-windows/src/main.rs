#![allow(dead_code)]
mod canvas;
mod controls;
mod command;

use canvas::SkiaRenderer;
use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, RECT, WPARAM};
use windows::Win32::Graphics::Gdi::{
    BI_RGB, BITMAPINFO, BITMAPINFOHEADER, DIB_RGB_COLORS, GetStockObject, HBRUSH, HDC, SRCCOPY,
    SetBkMode, StretchDIBits, TRANSPARENT, WHITE_BRUSH,
};
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::UI::WindowsAndMessaging::{
    CS_HREDRAW, CS_VREDRAW, CreateWindowExW, DefWindowProcW, DispatchMessageW, GetClientRect,
    GetMessageW, IDC_ARROW, LoadCursorW, MSG, PostQuitMessage, RegisterClassW, SW_SHOW, ShowWindow,
    TranslateMessage, WM_COMMAND, WM_CTLCOLORSTATIC, WM_DESTROY, WM_PAINT, WNDCLASSW,
    WS_OVERLAPPEDWINDOW,
};
use windows::core::{Result, w};


static mut RENDERER: Option<SkiaRenderer> = None;

// Main Window Procedure callback
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
        WM_CTLCOLORSTATIC => {
            let hdc = HDC(wparam.0 as _);
            unsafe {
                SetBkMode(hdc, TRANSPARENT);
                LRESULT(GetStockObject(WHITE_BRUSH).0 as _)
            }
        }
        WM_PAINT => {
            let mut ps = windows::Win32::Graphics::Gdi::PAINTSTRUCT::default();
            let hdc = unsafe { windows::Win32::Graphics::Gdi::BeginPaint(hwnd, &mut ps) };

            let mut rect = RECT::default();
            let _ = unsafe { GetClientRect(hwnd, &mut rect) };
            let width = rect.right - rect.left;
            let height = rect.bottom - rect.top;

            if width > 0 && height > 0 {
                let batch = command::get_initial_operation_batch();
                let elements = command::build_scene_from_batch(&batch);

                unsafe {
                    if let Some(ref renderer ) = RENDERER {
                        if let Some(pixels) = renderer.render(width, height, &elements) {
                            let mut bmi = BITMAPINFO {
                                bmiHeader: BITMAPINFOHEADER {
                                    biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                                    biWidth: width,
                                    biHeight: -height,
                                    biPlanes: 1,
                                    biBitCount: 32,
                                    biCompression: BI_RGB.0,
                                    ..Default::default()
                                },
                                ..Default::default()
                            };
                            StretchDIBits(
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

fn main() -> Result<()> {
    unsafe {
        let instance = GetModuleHandleW(None)?;
        let class_name = w!("LeveloWindowsEngine");

        let wc = WNDCLASSW {
            style: CS_HREDRAW | CS_VREDRAW,
            lpfnWndProc: Some(window_proc),
            hInstance: instance.into(),
            lpszClassName: class_name,
            hbrBackground: HBRUSH(GetStockObject(WHITE_BRUSH).0),
            hCursor: LoadCursorW(None, IDC_ARROW).unwrap_or_default(),
            ..Default::default()
        };

        RegisterClassW(&wc);

        let main_hwnd = CreateWindowExW(
            Default::default(),
            class_name,
            w!("LeveloJS Native Windows Engine"),
            WS_OVERLAPPEDWINDOW,
            100,
            100,
            1200,
            800,
            None,
            None,
            Some(instance.into()),
            None,
        )?;

        let _ = ShowWindow(main_hwnd, SW_SHOW);
        RENDERER = Some(SkiaRenderer::new());

        let mut msg = MSG::default();
        while GetMessageW(&mut msg, None, 0, 0).as_bool() {
            let _ = TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }
    }

    Ok(())
}
