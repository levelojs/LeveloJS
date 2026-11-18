// packages/levelojs/src/styles/native.ts

import type { CompiledStyleTuple, NativeClassMap, NativeStyleToken, StyleRules } from './types.js';

export type {
  ClassMap,
  CompiledStyleTuple,
  NativeClassMap,
  NativeStyleToken,
  StyleRules,
} from './types.js';

function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`);
}

/**
 * Pre-compiles style rule objects into direct native SetStyle command tuples
 * with zero DOM or CSS stylesheet overhead.
 */
export function style(rulesObj: StyleRules): NativeClassMap {
  const uniqueHash = Math.random().toString(36).substring(2, 7);
  const classMap: NativeClassMap = {};

  for (const [selector, properties] of Object.entries(rulesObj)) {
    const rawClassName = selector.startsWith('.') ? selector.substring(1) : selector;
    const scopedName = `${rawClassName}_${uniqueHash}`;

    const compiled: CompiledStyleTuple[] = [];
    for (const [prop, val] of Object.entries(properties)) {
      if (val === null || val === undefined) continue;
      compiled.push([toKebabCase(prop), String(val)]);
    }

    classMap[rawClassName] = {
      __nativeStyles: compiled,
      toString() {
        return scopedName;
      },
    };
  }

  return classMap;
}

/**
 * Type guard to check if a value is a pre-compiled NativeStyleToken.
 */
export function isNativeStyleToken(value: unknown): value is NativeStyleToken {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__nativeStyles' in value &&
    Array.isArray((value as NativeStyleToken).__nativeStyles)
  );
}
