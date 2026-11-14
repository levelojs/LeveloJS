// packages/levelojs/src/runtime/native/types.ts

/**
 * Numeric OpCodes matching Rust Native Host directly for high performance FFI
 */
export enum NativeOpCode {
  CreateElement = 1,
  CreateText = 2,
  AppendChild = 3,
  InsertBefore = 4,
  ReplaceChild = 5,
  RemoveChild = 6,
  DeleteNode = 7,
  SetProperty = 8,
  RemoveProperty = 9,
  SetStyle = 10,
  RemoveStyle = 11,
  SetText = 12,
  AddEventListener = 13,
  RemoveEventListener = 14,
}

export type PropertyValue = string | number | boolean;

/**
 * Universal Native Commands covering full UI Lifecycle and Reactivity
 */
export type NativeCommand =
  // Lifecycle
  | { op: 'CreateElement'; opcode: NativeOpCode.CreateElement; node: number; element_type: string }
  | { op: 'CreateText'; opcode: NativeOpCode.CreateText; node: number; text: string }
  | { op: 'DeleteNode'; opcode: NativeOpCode.DeleteNode; node: number }

  // Hierarchy & Mutations
  | { op: 'AppendChild'; opcode: NativeOpCode.AppendChild; parent: number; child: number }
  | {
      op: 'InsertBefore';
      opcode: NativeOpCode.InsertBefore;
      parent: number;
      child: number;
      reference: number;
    }
  | {
      op: 'ReplaceChild';
      opcode: NativeOpCode.ReplaceChild;
      parent: number;
      new_child: number;
      old_child: number;
    }
  | { op: 'RemoveChild'; opcode: NativeOpCode.RemoveChild; parent: number; child: number }

  // Properties & Attributes (e.g. placeholder, disabled, src, value)
  | {
      op: 'SetProperty';
      opcode: NativeOpCode.SetProperty;
      node: number;
      name: string;
      value: PropertyValue;
    }
  | { op: 'RemoveProperty'; opcode: NativeOpCode.RemoveProperty; node: number; name: string }

  // Styles
  | { op: 'SetStyle'; opcode: NativeOpCode.SetStyle; node: number; name: string; value: string }
  | { op: 'RemoveStyle'; opcode: NativeOpCode.RemoveStyle; node: number; name: string }

  // Text Content
  | { op: 'SetText'; opcode: NativeOpCode.SetText; node: number; text: string }

  // Events & Listeners
  | {
      op: 'AddEventListener';
      opcode: NativeOpCode.AddEventListener;
      node: number;
      event: string;
      listener_id: number;
    }
  | {
      op: 'RemoveEventListener';
      opcode: NativeOpCode.RemoveEventListener;
      node: number;
      event: string;
      listener_id: number;
    };

export interface NativeNodeHandle {
  readonly id: number;
  readonly tag: string;
}
