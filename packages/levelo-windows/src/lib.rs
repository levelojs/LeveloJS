// packages/levelo-windows/src/lib.rs
#![allow(dead_code)]

pub mod canvas;
pub mod command;
pub mod style;
pub mod layout;
pub mod js_engine;

use canvas::SkiaRenderer;
use command::OperationBatch;
use js_engine::JsEngine;
use layout::LayoutBox;
use std::cell::UnsafeCell;
use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, RECT, WPARAM};
use windows::Win32::Graphics::Gdi::{
    BI_RGB, BITMAPINFO, BITMAPINFOHEADER, DIB_RGB_COLORS, InvalidateRect, SRCCOPY, StretchDIBits,
};
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::UI::WindowsAndMessaging::{
    CS_HREDRAW, CS_VREDRAW, CreateWindowExW, DefWindowProcW, DispatchMessageW, GetClientRect,
    GetMessageW, IDC_ARROW, LoadCursorW, MSG, PostQuitMessage, RegisterClassW,
    SW_SHOW, ShowWindow, TranslateMessage, WM_COMMAND, WM_DESTROY, WM_ERASEBKGND,
    WM_LBUTTONDOWN, WM_PAINT, WNDCLASSW, WS_OVERLAPPEDWINDOW,
};
use windows::core::{Result, w};

/// Zero-cost thread marker allowing single-threaded GUI resources to reside in statics safely
struct SingleThreadCell<T>(UnsafeCell<T>);
unsafe impl<T> Sync for SingleThreadCell<T> {}

impl<T> SingleThreadCell<T> {
    const fn new(val: T) -> Self {
        Self(UnsafeCell::new(val))
    }
    #[allow(clippy::mut_from_ref)]
    unsafe fn get_mut(&self) -> &mut T {
        unsafe { &mut *self.0.get() }
    }
    unsafe fn get_ref(&self) -> &T {
        unsafe { &*self.0.get() }
    }
}

static RENDERER: SingleThreadCell<Option<SkiaRenderer>> = SingleThreadCell::new(None);
static JS_ENGINE: SingleThreadCell<Option<JsEngine>> = SingleThreadCell::new(None);
static SCENE_BATCH: SingleThreadCell<Option<OperationBatch>> = SingleThreadCell::new(None);
static CURRENT_LAYOUT_BOXES: SingleThreadCell<Vec<LayoutBox>> = SingleThreadCell::new(Vec::new());

// Mapping table: Node ID -> Listener ID
static NODE_LISTENERS: SingleThreadCell<Vec<(u64, u64)>> = SingleThreadCell::new(Vec::new());

/// Registers listener IDs from newly appended operations into NODE_LISTENERS lookup table
unsafe fn sync_event_listeners(batch: &OperationBatch) {
    let list = unsafe { NODE_LISTENERS.get_mut() };
    for op in batch.iter() {
        if let command::Operation::AddEventListener { node, listener_id, .. } = op {
            // Remove existing mapping for the node if present
            list.retain(|(n, _)| *n != node.0);
            list.push((node.0, *listener_id));
        }
    }
}

unsafe extern "system" fn window_proc(
    hwnd: HWND,
    msg: u32,
    wparam: WPARAM,
    lparam: LPARAM,
) -> LRESULT {
    match msg {
        WM_COMMAND => {
            let control_id = (wparam.0 & 0xffff) as usize;
            println!("LeveloJS Engine: Command received -> {}", control_id);
            LRESULT(0)
        }

        // Direct Mouse Click Dispatch to QuickJS
        WM_LBUTTONDOWN => {
            let click_x = (lparam.0 & 0xffff) as i16 as f32;
            let click_y = ((lparam.0 >> 16) & 0xffff) as i16 as f32;

            let mut clicked_node_id: Option<u64> = None;

            unsafe {
                let boxes = CURRENT_LAYOUT_BOXES.get_ref();
                // Find clicked element in reverse order (topmost layer first)
                for b in boxes.iter().rev() {
                    if click_x >= b.x && click_x <= (b.x + b.width) && click_y >= b.y && click_y <= (b.y + b.height) {
                        clicked_node_id = Some(b.id);
                        break;
                    }
                }

                if let Some(node_id) = clicked_node_id {
                    let listener_list = NODE_LISTENERS.get_ref();

                    // Find registered listener ID for this DOM node
                    if let Some(&(_, listener_id)) = listener_list.iter().find(|(n, _)| *n == node_id) {
                        if let Some(ref engine) = *JS_ENGINE.get_ref() {
                            println!("[Levelo Engine] Triggering listener ID: {} for Node: {}", listener_id, node_id);
                            engine.trigger_listener(listener_id);

                            let new_ops = engine.take_batch();
                            if !new_ops.is_empty() {
                                println!("[Levelo Engine] Received {} mutation ops after click", new_ops.len());
                                sync_event_listeners(&new_ops);

                                if let Some(ref mut current_batch) = *SCENE_BATCH.get_mut() {
                                    for op in new_ops {
                                        current_batch.push(op);
                                    }
                                }
                                let _ = InvalidateRect(Some(hwnd), None, false);
                            }
                        }
                    } else {
                        println!("[Levelo Engine] Click detected on Node: {}, but no listener was registered", node_id);
                    }
                }
            }

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
                unsafe {
                    // Pull any pending ops from JS engine
                    if let Some(ref engine) = *JS_ENGINE.get_ref() {
                        let pending = engine.take_batch();
                        if !pending.is_empty() {
                            sync_event_listeners(&pending);
                            if let Some(ref mut batch) = *SCENE_BATCH.get_mut() {
                                for op in pending {
                                    batch.push(op);
                                }
                            }
                        }
                    }

                    let batch = SCENE_BATCH
                        .get_ref()
                        .as_ref()
                        .cloned()
                        .unwrap_or_default();

                    let elements = command::build_scene_from_batch(&batch);
                    let layout_boxes = layout::LayoutEngine::compute(&elements, width as f32, height as f32);

                    *CURRENT_LAYOUT_BOXES.get_mut() = layout_boxes.clone();

                    if let Some(ref renderer) = *RENDERER.get_ref() {
                        if let Some(pixels) = renderer.render(width, height, &layout_boxes) {
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
                                eprintln!("[Levelo Engine] GDI StretchDIBits failed to blit surface.");
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

/// Public API: Starts the Levelo Native Windows Host powered by QuickJS
pub fn run_engine(title: &str, width: i32, height: i32) -> Result<()> {
    unsafe {
        *RENDERER.get_mut() = Some(SkiaRenderer::new());

        // 1. Initialize QuickJS Embedded Engine
        println!("[Levelo Engine] Initializing QuickJS Engine...");
        let engine = match JsEngine::new() {
            Ok(e) => e,
            Err(err) => {
                eprintln!("[Levelo Engine] Failed to initialize JsEngine: {:?}", err);
                return Ok(());
            }
        };

        // 2. Load bundle.js into memory
        let bundle_candidates = [
            "../dist-native/bundle.js",
            "../../playground/dist-native/bundle.js",
            "playground/dist-native/bundle.js",
            "dist-native/bundle.js",
            "bundle.js",
        ];

        let mut loaded = false;
        for path in &bundle_candidates {
            if let Ok(code) = std::fs::read_to_string(path) {
                println!("[Levelo Engine] Loaded script bundle from: {}", path);
                if let Err(e) = engine.load_bundle(&code) {
                    eprintln!("[Levelo Engine] Error executing bundle: {:?}", e);
                } else {
                    loaded = true;
                    break;
                }
            }
        }

        if !loaded {
            eprintln!("[Levelo Engine] Warning: bundle.js not found! Fallback to initial mock batch.");
            let fallback = command::get_initial_operation_batch();
            sync_event_listeners(&fallback);
            *SCENE_BATCH.get_mut() = Some(fallback);
        } else {
            let initial_batch = engine.take_batch();
            sync_event_listeners(&initial_batch);
            *SCENE_BATCH.get_mut() = Some(initial_batch);
        }

        *JS_ENGINE.get_mut() = Some(engine);

        // 3. Register and display Native Windows Window
        let instance = GetModuleHandleW(None)?;
        let class_name = w!("LeveloWindowsEngine");

        let wc = WNDCLASSW {
            style: CS_HREDRAW | CS_VREDRAW,
            lpfnWndProc: Some(window_proc),
            hInstance: instance.into(),
            lpszClassName: class_name,
            hbrBackground: Default::default(),
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
        let _ = InvalidateRect(Some(main_hwnd), None, false);

        let mut msg = MSG::default();
        while GetMessageW(&mut msg, None, 0, 0).as_bool() {
            let _ = TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }
    }

    Ok(())
}