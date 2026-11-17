export interface ResolvedLeveloConfig {
  web?: {
    outDir?: string;
    minify?: boolean;
    sourcemap?: boolean;
    port?: number;
  };
}
