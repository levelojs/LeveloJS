// packages/levelojs/src/runtime/native/serializer.ts
import { InternalRenderNode } from "../renderer/tree/InternalRenderNode.js";

export interface NativeBatchCommand {
  cmd: "create_node" | "set_text" | "set_style" | "append" | "attach_event";
  id: number;
  parentId?: number;
  tag?: string;
  text?: string;
  styles?: Record<string, string>;
  event?: string;
}

