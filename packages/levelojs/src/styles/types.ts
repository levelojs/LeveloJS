// packages/levelojs/src/styles/types.ts

export interface StyleRules {
  [selector: string]: Record<string, string | number>;
}

export interface ClassMap {
  [rawKey: string]: string;
}

export type CompiledStyleTuple = [property: string, value: string];

export interface NativeStyleToken {
  readonly __nativeStyles: CompiledStyleTuple[];
  toString(): string;
}

export interface NativeClassMap {
  [rawKey: string]: NativeStyleToken;
}
