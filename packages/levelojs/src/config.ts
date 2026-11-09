// packages/levelojs/src/config.ts

// =========================================================
// =========================================================
// web app config ==========================================
export interface WebMetaTag {
  name?: string;
  property?: string;
  content: string;
}

export interface WebLinkTag {
  rel: string;
  href: string;
  type?: string;
}

export interface WebConfig {
  title?: string;
  lang?: string;
  icon?: string;
  meta?: WebMetaTag[];
  links?: WebLinkTag[];
}

// =====================================================
// =====================================================
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
// ========================================================
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