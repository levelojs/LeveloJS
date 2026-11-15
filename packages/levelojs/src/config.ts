// packages/levelojs/src/config.ts

// web app config ==========================================
export interface WebConfig {
  outDir?: string;
  minify?: boolean;
  sourcemap?: boolean;
  port?: number;
}

// Native app config ===================================
export interface NativeWindowConfig {
  title?: string;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizable?: boolean;
  decorations?: boolean;
}

export interface NativeConfig {
  window?: NativeWindowConfig;
}

// ========================================================
export interface LeveloConfig {
  name?: string;
  version?: string;
  icon?: string;
  web?: WebConfig;
  native?: NativeConfig;
}

export function defineConfig(config: LeveloConfig): LeveloConfig {
  return config;
}
