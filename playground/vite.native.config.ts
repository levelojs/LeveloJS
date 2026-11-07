// playground/vite.native.config.ts
import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "levelojs/native",
  },
  resolve: {
    alias: [
      {
        find: "levelojs/native/jsx-runtime",
        replacement: path.resolve(__dirname, "../packages/levelojs/src/runtime/native/jsx-runtime.ts"),
      },
      {
        find: /^levelojs$/,
        replacement: path.resolve(__dirname, "../packages/levelojs/src/index.ts"),
      },
    ],
  },
  build: {
    outDir: "dist-native",
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: path.resolve(__dirname, "src/entry-native.ts"),
      name: "LeveloNativeApp",
      formats: ["iife"],
      fileName: () => "bundle.js",
    },
  },
});