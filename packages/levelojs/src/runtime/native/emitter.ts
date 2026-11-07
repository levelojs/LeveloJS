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
    }

    static registerListener(fn: Function): number {
        const id = this.nextListenerId++;
        this.listeners.set(id, fn);
        return id;
    }

    static getBatch(): NativeCommand[] {
        return this.buffer;
    }

    static clear(): void {
        this.buffer = [];
    }
}