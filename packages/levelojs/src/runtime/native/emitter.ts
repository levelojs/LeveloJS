// packages/levelojs/src/runtime/native/emitter.ts

export type NativeCommand =
    | { op: "CreateElement"; node: number; element_type: string }
    | { op: "CreateText"; node: number; text: string }
    | { op: "AppendChild"; parent: number; child: number }
    | { op: "SetStyle"; node: number; name: string; value: string }
    | { op: "SetText"; node: number; text: string }
    | { op: "AddEventListener"; node: number; event: string; listener_id: number };

export class NativeEmitter {
    private static buffer: NativeCommand[] = [];
    private static nextListenerId = 1;
    public static listeners = new Map<number, Function>();

    static emit(cmd: NativeCommand): void {
        this.buffer.push(cmd);

        // Direct in-memory FFI transmission to Rust host (Zero JSON overhead)
        if (typeof (globalThis as any).__native_emit_op === "function") {
            switch (cmd.op) {
                case "CreateElement":
                    (globalThis as any).__native_emit_op(1, cmd.node, cmd.element_type, 0, "");
                    break;
                case "CreateText":
                    (globalThis as any).__native_emit_op(2, cmd.node, cmd.text, 0, "");
                    break;
                case "AppendChild":
                    (globalThis as any).__native_emit_op(3, cmd.parent, "", cmd.child, "");
                    break;
                case "SetStyle":
                    (globalThis as any).__native_emit_op(4, cmd.node, cmd.name, 0, cmd.value);
                    break;
                case "SetText":
                    (globalThis as any).__native_emit_op(5, cmd.node, cmd.text, 0, "");
                    break;
                case "AddEventListener":
                    (globalThis as any).__native_emit_op(6, cmd.node, cmd.event, cmd.listener_id, "");
                    break;
            }
        }
    }

    static registerListener(fn: Function): number {
        const id = this.nextListenerId++;
        this.listeners.set(id, fn);

        // Register into QuickJS runtime global map
        if (typeof (globalThis as any).__registerNativeListener === "function") {
            (globalThis as any).__registerNativeListener(id, fn);
        }
        return id;
    }

    static getBatch(): NativeCommand[] {
        return this.buffer;
    }

    static clear(): void {
        this.buffer = [];
    }
}