import { App } from "./App";
import { NativeEmitter } from "../../packages/levelojs/src/runtime/native/emitter";

App();

export const initialBatch = NativeEmitter.getBatch();

(globalThis as any).__LEVELO_BATCH__ = initialBatch;

console.log(`[Levelo Native] Generated ${initialBatch.length} initial operations.`);