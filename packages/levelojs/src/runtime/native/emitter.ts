// packages/levelojs/src/runtime/native/emitter.ts
import { NativeCommand } from './types.js';

export class NativeEmitter {
  private static buffer: NativeCommand[] = [];
  private static nextListenerId = 1;
  public static listeners = new Map<number, Function>();

  static emit(cmd: NativeCommand): void {
    this.buffer.push(cmd);

    // Direct in-memory FFI transmission to Rust host (Zero JSON overhead)
    if (typeof (globalThis as any).__native_emit_op === 'function') {
      const emit = (globalThis as any).__native_emit_op;
      switch (cmd.op) {
        // Lifecycle
        case 'CreateElement':
          emit(cmd.opcode, cmd.node, cmd.element_type, 0, '');
          break;
        case 'CreateText':
          emit(cmd.opcode, cmd.node, cmd.text, 0, '');
          break;
        case 'DeleteNode':
          emit(cmd.opcode, cmd.node, '', 0, '');
          break;

        // Hierarchy & Mutations
        case 'AppendChild':
          emit(cmd.opcode, cmd.parent, '', cmd.child, '');
          break;
        case 'InsertBefore':
          emit(cmd.opcode, cmd.parent, '', cmd.child, String(cmd.reference));
          break;
        case 'ReplaceChild':
          emit(cmd.opcode, cmd.parent, '', cmd.new_child, String(cmd.old_child));
          break;
        case 'RemoveChild':
          emit(cmd.opcode, cmd.parent, '', cmd.child, '');
          break;

        // Properties & Attributes
        case 'SetProperty':
          emit(cmd.opcode, cmd.node, cmd.name, 0, String(cmd.value));
          break;

        case 'RemoveProperty':
          emit(cmd.opcode, cmd.node, cmd.name, 0, '');
          break;

        // Style
        case 'SetStyle':
          emit(cmd.opcode, cmd.node, cmd.name, 0, cmd.value);
          break;

        case 'RemoveStyle':
          emit(cmd.opcode, cmd.node, cmd.name, 0, '');
          break;

        // Text Content
        case 'SetText':
          emit(cmd.opcode, cmd.node, cmd.text, 0, '');
          break;

        // Events & Listeners
        case 'AddEventListener':
          emit(cmd.opcode, cmd.node, cmd.event, cmd.listener_id, '');
          break;

        case 'RemoveEventListener':
          emit(cmd.opcode, cmd.node, cmd.event, cmd.listener_id, '');
          break;
      }
    }
  }

  static registerListener(fn: Function): number {
    const id = this.nextListenerId++;
    this.listeners.set(id, fn);

    // Register into QuickJS runtime global map
    if (typeof (globalThis as any).__registerNativeListener === 'function') {
      (globalThis as any).__registerNativeListener(id, fn);
    }
    return id;
  }

  static removeListener(id: number): void {
    this.listeners.delete(id);
    if (typeof (globalThis as any).__removeNativeListener === 'function') {
      (globalThis as any).__removeNativeListener(id);
    }
  }

  static getBatch(): NativeCommand[] {
    return this.buffer;
  }

  static clear(): void {
    this.buffer = [];
  }
}
