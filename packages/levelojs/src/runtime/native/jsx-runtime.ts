// packages/levelojs/src/runtime/native/jsx-runtime.ts
import { NativeEmitter } from "./emitter.js";

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
        // Pass a single child as-is, multiple children as an array
        const childProp =
            children.length === 0 ? undefined : children.length === 1 ? children[0] : children;
        return type({ ...props, children: childProp });
    }

    const id = nextNodeId++;

    NativeEmitter.emit({ op: "CreateElement", node: id, element_type: type });

    if (props) {
        for (const [key, value] of Object.entries(props)) {
            if (value === null || value === undefined || RESERVED_PROPS.has(key)) continue;

            if (key.startsWith("on") && typeof value === "function") {
                const listenerId = NativeEmitter.registerListener(value);
                NativeEmitter.emit({
                    op: "AddEventListener",
                    node: id,
                    event: key.slice(2).toLowerCase(),
                    listener_id: listenerId,
                });
            } else if (key === "style" && typeof value === "object") {
                for (const [sKey, sVal] of Object.entries(value)) {
                    if (sVal !== null && sVal !== undefined) {
                        NativeEmitter.emit({ op: "SetStyle", node: id, name: sKey, value: String(sVal) });
                    }
                }
            } else if (typeof value !== "function") {
                NativeEmitter.emit({ op: "SetStyle", node: id, name: key, value: String(value) });
            }
        }
    }

    for (const child of children.flat(Infinity)) {
        if (child === null || child === undefined || child === false || child === "") continue;

        if (typeof child === "string" || typeof child === "number") {
            const textNodeId = nextNodeId++;
            NativeEmitter.emit({ op: "CreateText", node: textNodeId, text: String(child) });
            NativeEmitter.emit({ op: "AppendChild", parent: id, child: textNodeId });
        } else if (typeof child === "object" && "id" in child) {
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

// Needed if you ever use <>...</> fragments
export const Fragment = (props: { children?: any }) => props.children;