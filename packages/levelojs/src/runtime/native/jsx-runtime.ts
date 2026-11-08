// packages/levelojs/src/runtime/native/jsx-runtime.ts
import { NativeEmitter } from "./emitter.js";
import { effect } from "../reactivity/reactivity.js";

let nextNodeId = 1;

export interface NativeNodeHandle {
    readonly id: number;
    readonly tag: string;
}

const RESERVED_PROPS = new Set(["children", "key", "ref"]);

function render(
    type: string | Function,
    props: Record<string, any> | null,
    children: any[],
): NativeNodeHandle | any {
    if (typeof type === "function") {
        // Pass single child directly or multiple children as an array
        const childProp =
            children.length === 0 ? undefined : children.length === 1 ? children[0] : children;
        return type({ ...props, children: childProp });
    }

    const id = nextNodeId++;

    NativeEmitter.emit({ op: "CreateElement", node: id, element_type: type });

    if (props) {
        for (const [key, value] of Object.entries(props)) {
            if (value === null || value === undefined || RESERVED_PROPS.has(key)) continue;

            // Event listener registration
            if (key.startsWith("on") && typeof value === "function") {
                const listenerId = NativeEmitter.registerListener(value);
                NativeEmitter.emit({
                    op: "AddEventListener",
                    node: id,
                    event: key.slice(2).toLowerCase(),
                    listener_id: listenerId,
                });
            }
            // Style object handling (static and reactive properties)
            else if (key === "style" && typeof value === "object") {
                for (const [sKey, sVal] of Object.entries(value)) {
                    if (sVal === null || sVal === undefined) continue;

                    if (typeof sVal === "function") {
                        effect(() => {
                            const resolvedVal = (sVal as Function)();
                            NativeEmitter.emit({
                                op: "SetStyle",
                                node: id,
                                name: sKey,
                                value: String(resolvedVal ?? ""),
                            });
                        });
                    } else {
                        NativeEmitter.emit({ op: "SetStyle", node: id, name: sKey, value: String(sVal) });
                    }
                }
            }
            // Reactive prop/style function binding
            else if (typeof value === "function") {
                effect(() => {
                    const resolvedVal = (value as Function)();
                    NativeEmitter.emit({
                        op: "SetStyle",
                        node: id,
                        name: key,
                        value: String(resolvedVal ?? ""),
                    });
                });
            }
            // Static property binding
            else {
                NativeEmitter.emit({ op: "SetStyle", node: id, name: key, value: String(value) });
            }
        }
    }

    for (const child of children.flat(Infinity)) {
        if (child === null || child === undefined || child === false || child === "") continue;

        // Reactive text node driven by signal/getter function
        if (typeof child === "function") {
            const textNodeId = nextNodeId++;
            NativeEmitter.emit({ op: "CreateText", node: textNodeId, text: "" });
            NativeEmitter.emit({ op: "AppendChild", parent: id, child: textNodeId });

            effect(() => {
                const resolvedText = (child as Function)();
                NativeEmitter.emit({
                    op: "SetText",
                    node: textNodeId,
                    text: String(resolvedText ?? ""),
                });
            });
        }
        // Static string or numeric text child
        else if (typeof child === "string" || typeof child === "number") {
            const textNodeId = nextNodeId++;
            NativeEmitter.emit({ op: "CreateText", node: textNodeId, text: String(child) });
            NativeEmitter.emit({ op: "AppendChild", parent: id, child: textNodeId });
        }
        // Nested DOM/Native node handle
        else if (typeof child === "object" && "id" in child) {
            NativeEmitter.emit({ op: "AppendChild", parent: id, child: (child as NativeNodeHandle).id });
        }
    }

    return { id, tag: type };
}

// Automatic runtime entry: children arrive inside props.children
export function jsx(type: string | Function, props: Record<string, any> | null, _key?: any) {
    const { children, ...rest } = props ?? {};
    return render(type, rest, children === undefined ? [] : [children]);
}
export { jsx as jsxs };

// Classic entry, kept for manual h() calls
export function h(type: string | Function, props: Record<string, any> | null, ...children: any[]) {
    return render(type, props, children);
}

// Fragment component support
export const Fragment = (props: { children?: any }) => props.children;