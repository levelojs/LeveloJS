// packages/levelo-windows/src/js_engine.rs

use crate::command::{NodeId, Operation, OperationBatch};
use rquickjs::function::Rest;
use rquickjs::{Context, Function, Runtime};
use std::sync::{Arc, Mutex};

pub struct JsEngine {
    runtime: Runtime,
    pub context: Context,
    pub batch: Arc<Mutex<OperationBatch>>,
}

impl JsEngine {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let runtime = Runtime::new()?;
        let context = Context::full(&runtime)?;
        let batch = Arc::new(Mutex::new(OperationBatch::new()));

        let b = batch.clone();

        context.with(|ctx| -> Result<(), Box<dyn std::error::Error>> {
            let globals = ctx.globals();

            // 1. Initialize Console logger with variable argument formatting
            let console = rquickjs::Object::new(ctx.clone())?;

            console.set(
                "log",
                Function::new(ctx.clone(), |args: Rest<rquickjs::Value>| {
                    let mut parts = Vec::new();
                    for val in args.0 {
                        if let Some(s) = val.as_string() {
                            if let Ok(st) = s.to_string() {
                                parts.push(st);
                                continue;
                            }
                        } else if let Some(i) = val.as_int() {
                            parts.push(i.to_string());
                            continue;
                        } else if let Some(f) = val.as_float() {
                            parts.push(f.to_string());
                            continue;
                        } else if let Some(b) = val.as_bool() {
                            parts.push(b.to_string());
                            continue;
                        }
                        parts.push(format!("{:?}", val));
                    }
                    println!("[JS Log] {}", parts.join(" "));
                })?,
            )?;

            console.set(
                "error",
                Function::new(ctx.clone(), |args: Rest<rquickjs::Value>| {
                    let mut parts = Vec::new();
                    for val in args.0 {
                        if let Some(s) = val.as_string() {
                            if let Ok(st) = s.to_string() {
                                parts.push(st);
                                continue;
                            }
                        } else if let Some(i) = val.as_int() {
                            parts.push(i.to_string());
                            continue;
                        } else if let Some(f) = val.as_float() {
                            parts.push(f.to_string());
                            continue;
                        } else if let Some(b) = val.as_bool() {
                            parts.push(b.to_string());
                            continue;
                        }
                        parts.push(format!("{:?}", val));
                    }
                    eprintln!("[JS Error] {}", parts.join(" "));
                })?,
            )?;

            console.set(
                "warn",
                Function::new(ctx.clone(), |args: Rest<rquickjs::Value>| {
                    let mut parts = Vec::new();
                    for val in args.0 {
                        if let Some(s) = val.as_string() {
                            if let Ok(st) = s.to_string() {
                                parts.push(st);
                                continue;
                            }
                        } else if let Some(i) = val.as_int() {
                            parts.push(i.to_string());
                            continue;
                        } else if let Some(f) = val.as_float() {
                            parts.push(f.to_string());
                            continue;
                        } else if let Some(b) = val.as_bool() {
                            parts.push(b.to_string());
                            continue;
                        }
                        parts.push(format!("{:?}", val));
                    }
                    println!("[JS Warn] {}", parts.join(" "));
                })?,
            )?;

            globals.set("console", console)?;

            // 2. Direct zero-copy FFI operation emitter
            globals.set(
                "__native_emit_op",
                Function::new(
                    ctx.clone(),
                    move |op_code: u8, node: f64, s1: String, n2: f64, s2: String| {
                        if let Ok(mut lock) = b.lock() {
                            let node_id = NodeId::new(node as u64);

                            match op_code {
                                1 => lock.push(Operation::CreateElement {
                                    node: node_id,
                                    element_type: s1,
                                }),
                                2 => lock.push(Operation::CreateText {
                                    node: node_id,
                                    text: s1,
                                }),
                                3 => lock.push(Operation::AppendChild {
                                    parent: node_id,
                                    child: NodeId::new(n2 as u64),
                                }),
                                4 => lock.push(Operation::SetStyle {
                                    node: node_id,
                                    name: s1,
                                    value: s2,
                                }),
                                5 => lock.push(Operation::SetText {
                                    node: node_id,
                                    text: s1,
                                }),
                                6 => lock.push(Operation::AddEventListener {
                                    node: node_id,
                                    event: s1,
                                    listener_id: n2 as u64,
                                }),
                                _ => {}
                            }
                        }
                    },
                )?,
            )?;

            // 3. Register native listener lookup table in JS global scope
            ctx.eval::<(), _>(
                r#"
                globalThis.__LEVELO_LISTENERS__ = new Map();
                globalThis.__registerNativeListener = function(id, cb) {
                    console.log("[JS Core] Registered listener id: " + id);
                    globalThis.__LEVELO_LISTENERS__.set(id, cb);
                };
                globalThis.__dispatchNativeEvent = function(listenerId) {
                    console.log("[JS Core] Dispatching native event for listener: " + listenerId);
                    const handler = globalThis.__LEVELO_LISTENERS__.get(listenerId);
                    if (typeof handler === 'function') {
                        handler();
                        console.log("[JS Core] Handler executed successfully for listener: " + listenerId);
                    } else {
                        console.warn("[JS Core] No handler function found for listener id: " + listenerId);
                    }
                };
                "#,
            )?;

            Ok(())
        })?;

        Ok(Self {
            runtime,
            context,
            batch,
        })
    }

    /// Evaluates pre-bundled JavaScript code into the runtime
    pub fn load_bundle(&self, bundle_code: &str) -> Result<(), Box<dyn std::error::Error>> {
        self.context.with(|ctx| {
            if let Err(_err) = ctx.eval::<(), _>(bundle_code) {
                if let Some(exception) = ctx.catch().as_exception() {
                    let msg = exception
                        .message()
                        .unwrap_or_else(|| "Unknown error message".to_string());
                    let stack = exception
                        .stack()
                        .unwrap_or_else(|| "No stack trace available".to_string());

                    eprintln!(
                        "\n================= [QuickJS Runtime Error] =================\nMessage: {}\nStack:\n{}\n===========================================================\n",
                        msg, stack
                    );
                } else {
                    eprintln!("[QuickJS] Unknown JS execution failure.");
                }
                return Err("Failed to evaluate bundle.js".into());
            }
            Ok(())
        })
    }

    /// Dispatches UI event to JS listener and safely flushes any pending microtasks
    pub fn trigger_listener(&self, listener_id: u64) {
        // Step 1: Execute listener within scoped context lock
        self.context.with(|ctx| {
            let globals = ctx.globals();
            match globals.get::<_, Function>("__dispatchNativeEvent") {
                Ok(dispatch_fn) => {
                    if let Err(err) = dispatch_fn.call::<_, ()>((listener_id as f64,)) {
                        if let Some(exception) = ctx.catch().as_exception() {
                            let msg = exception.message().unwrap_or_else(|| "Unknown".to_string());
                            let stack = exception
                                .stack()
                                .unwrap_or_else(|| "No stack trace".to_string());
                            eprintln!(
                                "\n[QuickJS Listener Exception] ID: {}\nMessage: {}\nStack:\n{}\n",
                                listener_id, msg, stack
                            );
                        } else {
                            eprintln!("[QuickJS] Listener execution failed: {:?}", err);
                        }
                    }
                }
                Err(e) => {
                    eprintln!(
                        "[QuickJS] __dispatchNativeEvent function not found on globals: {:?}",
                        e
                    );
                }
            }
        });

        // Step 2: Flush pending microtasks outside of context.with lock to avoid RefCell panics
        while self.runtime.is_job_pending() {
            let _ = self.runtime.execute_pending_job();
        }
    }

    /// Takes and drains all accumulated operations out of the batch
    pub fn take_batch(&self) -> OperationBatch {
        if let Ok(mut lock) = self.batch.lock() {
            let current = lock.clone();
            lock.clear();
            current
        } else {
            OperationBatch::new()
        }
    }
}