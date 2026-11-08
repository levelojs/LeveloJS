import type { Plugin } from "esbuild";
import { readFile } from "node:fs/promises";
import { transformLeveloCode } from "../compiler/babel.js";

export function leveloWebPlugin(): Plugin {
  return {
    name: "levelo-web-plugin",
    setup(build) {
      // 1. Intercept JSX and TSX files
      build.onLoad({ filter: /\.[jt]sx$/ }, async (args) => {
        const source = await readFile(args.path, "utf8");

        try {
          const transformedCode = await transformLeveloCode(source, args.path);
          return {
            contents: transformedCode,
            loader: "jsx", // Fallback safety for any nested JSX
          };
        } catch (err: any) {
          return {
            errors: [
              {
                text: `[Levelo Web Transform Error] ${err.message}`,
                location: { file: args.path },
              },
            ],
          };
        }
      });

      // 2. Intercept CSS files and dynamically inject them into the DOM <head>
      build.onLoad({ filter: /\.css$/ }, async (args) => {
        const cssContent = await readFile(args.path, "utf8");
        // Convert CSS into an in-memory JS snippet that auto-injects into DOM
        const jsInjector = `
          (() => {
            const style = document.createElement('style');
            style.setAttribute('data-levelo-path', ${JSON.stringify(args.path)});
            style.textContent = ${JSON.stringify(cssContent)};
            document.head.appendChild(style);
          })();
        `;
        return {
          contents: jsInjector,
          loader: "js",
        };
      });
    },
  };
}