// packages/levelojs/src/runtime/native/jsx-runtime.ts

import { isNativeStyleToken, type NativeStyleToken } from '../../styles/native.js';
import { effect } from '../reactivity/reactivity.js';
import { NativeEmitter } from './emitter.js';
import { NativeNodeHandle, NativeOpCode } from './types.js';

export { NativeNodeHandle };

let nextNodeId = 1;
const RESERVED_PROPS = new Set(['children', 'key', 'ref']);

function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (match) => `-${match.toLocaleLowerCase()}`);
}

function emitNativeStyleToken(nodeId: number, token: NativeStyleToken) {
  for (const [propName, propVal] of token.__nativeStyles) {
    NativeEmitter.emit({
      op: 'SetStyle',
      opcode: NativeOpCode.SetStyle,
      node: nodeId,
      name: propName,
      value: propVal,
    });
  }
}

function buildNode(
  type: string | Function,
  props: Record<string, any> | null,
  children: any[],
): NativeNodeHandle | any {
  if (typeof type === 'function') {
    const childProp =
      children.length === 0 ? undefined : children.length === 1 ? children[0] : children;
    return type({ ...props, children: childProp });
  }

  const id = nextNodeId++;

  NativeEmitter.emit({
    op: 'CreateElement',
    opcode: NativeOpCode.CreateElement,
    node: id,
    element_type: type,
  });

  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (value === null || value === undefined || RESERVED_PROPS.has(key)) continue;

      // Event listener registration
      if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase();
        const listenerId = NativeEmitter.registerListener(value);
        NativeEmitter.emit({
          op: 'AddEventListener',
          opcode: NativeOpCode.AddEventListener,
          node: id,
          event: eventName,
          listener_id: listenerId,
        });
      }
      // Class / className handling (supports pre-compiled NativeStyleToken from style())
      else if (key === 'class' || key === 'className') {
        if (isNativeStyleToken(value)) {
          emitNativeStyleToken(id, value);
          NativeEmitter.emit({
            op: 'SetProperty',
            opcode: NativeOpCode.SetProperty,
            node: id,
            name: 'class',
            value: value.toString(),
          });
        } else if (typeof value === 'function') {
          effect(() => {
            const resolvedVal = (value as Function)();
            if (isNativeStyleToken(resolvedVal)) {
              emitNativeStyleToken(id, resolvedVal);
            } else {
              NativeEmitter.emit({
                op: 'SetProperty',
                opcode: NativeOpCode.SetProperty,
                node: id,
                name: 'class',
                value: String(resolvedVal ?? ''),
              });
            }
          });
        } else {
          NativeEmitter.emit({
            op: 'SetProperty',
            opcode: NativeOpCode.SetProperty,
            node: id,
            name: 'class',
            value: String(value),
          });
        }
      }
      // Style object handling
      else if (key === 'style' && typeof value === 'object') {
        if (isNativeStyleToken(value)) {
          emitNativeStyleToken(id, value);
        } else {
          for (const [sKey, sVal] of Object.entries(value)) {
            if (sVal === null || sVal === undefined) continue;
            const kebabKey = toKebabCase(sKey);

            if (typeof sVal === 'function') {
              effect(() => {
                const resolvedVal = (sVal as Function)();
                NativeEmitter.emit({
                  op: 'SetStyle',
                  opcode: NativeOpCode.SetStyle,
                  node: id,
                  name: kebabKey,
                  value: String(resolvedVal ?? ''),
                });
              });
            } else {
              NativeEmitter.emit({
                op: 'SetStyle',
                opcode: NativeOpCode.SetStyle,
                node: id,
                name: kebabKey,
                value: String(sVal),
              });
            }
          }
        }
      }
      // Reactive Property / Attribute
      else if (typeof value === 'function') {
        effect(() => {
          const resolvedVal = (value as Function)();
          NativeEmitter.emit({
            op: 'SetProperty',
            opcode: NativeOpCode.SetProperty,
            node: id,
            name: key,
            value: resolvedVal,
          });
        });
      }
      // Static Property / Attribute
      else {
        NativeEmitter.emit({
          op: 'SetProperty',
          opcode: NativeOpCode.SetProperty,
          node: id,
          name: key,
          value: value,
        });
      }
    }
  }

  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false || child === '') continue;

    // Reactive child driven by signal / getter function
    if (typeof child === 'function') {
      let currentNodeId: number | null = null;
      let currentTextNodeId: number | null = null;

      effect(() => {
        const resolved = (child as Function)();
        console.log('[JS Reactivity] Signal updated, new text value:', resolved);

        // Text signal update
        if (typeof resolved === 'string' || typeof resolved === 'number') {
          const textStr = String(resolved);
          if (currentTextNodeId === null) {
            currentTextNodeId = nextNodeId++;
            NativeEmitter.emit({
              op: 'CreateText',
              opcode: NativeOpCode.CreateText,
              node: currentTextNodeId,
              text: textStr,
            });
            NativeEmitter.emit({
              op: 'AppendChild',
              opcode: NativeOpCode.AppendChild,
              parent: id,
              child: currentTextNodeId,
            });
          } else {
            NativeEmitter.emit({
              op: 'SetText',
              opcode: NativeOpCode.SetText,
              node: currentTextNodeId,
              text: textStr,
            });
          }
          console.log(
            '[JS Reactivity] Emitted SetText for Node:',
            currentTextNodeId,
            'Text:',
            textStr,
          );
        }
        // Conditional element swap
        else if (resolved && typeof resolved === 'object' && 'id' in resolved) {
          const newChildId = (resolved as NativeNodeHandle).id;
          if (currentNodeId !== null && currentNodeId !== newChildId) {
            NativeEmitter.emit({
              op: 'ReplaceChild',
              opcode: NativeOpCode.ReplaceChild,
              parent: id,
              new_child: newChildId,
              old_child: currentNodeId,
            });
          } else if (currentNodeId === null) {
            NativeEmitter.emit({
              op: 'AppendChild',
              opcode: NativeOpCode.AppendChild,
              parent: id,
              child: newChildId,
            });
          }
          currentNodeId = newChildId;
        }

        // Falsy removal
        else if (!resolved && currentNodeId !== null) {
          NativeEmitter.emit({
            op: 'RemoveChild',
            opcode: NativeOpCode.RemoveChild,
            parent: id,
            child: currentNodeId,
          });

          currentNodeId = null;
        }
      });
    }
    // Static string or numeric text child
    else if (typeof child === 'string' || typeof child === 'number') {
      const textNodeId = nextNodeId++;
      NativeEmitter.emit({
        op: 'CreateText',
        opcode: NativeOpCode.CreateText,
        node: textNodeId,
        text: String(child),
      });
      NativeEmitter.emit({
        op: 'AppendChild',
        opcode: NativeOpCode.AppendChild,
        parent: id,
        child: textNodeId,
      });
    }
    // Nested NativeNodeHandle child
    else if (typeof child === 'object' && 'id' in child) {
      NativeEmitter.emit({
        op: 'AppendChild',
        opcode: NativeOpCode.AppendChild,
        parent: id,
        child: (child as NativeNodeHandle).id,
      });
    }
  }

  return { id, tag: String(type) };
}

export function jsx(type: string | Function, props: Record<string, any> | null, _key?: any) {
  const { children, ...rest } = props ?? {};
  return buildNode(type, rest, children === undefined ? [] : [children]);
}

export { jsx as jsxs };

export function h(type: string | Function, props: Record<string, any> | null, ...children: any[]) {
  return buildNode(type, props, children);
}

export const Fragment = (props: { children?: any }) => props.children;
