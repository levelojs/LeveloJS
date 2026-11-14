import fsSync from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { transformLeveloCode } from '../compiler/babel.js';

export function leveloWebPlugin(rootDir: string = process.cwd()): Plugin {
  return {
    name: 'levelo-web-plugin',
    setup(build) {
      // Resolve root-relative public/ imports
      build.onResolve({ filter: /^\/.*$/ }, (args) => {
        if (args.kind !== 'import-statement') return null;

        const publicFilePath = path.join(rootDir, 'public', args.path);
        if (fsSync.existsSync(publicFilePath)) {
          return {
            path: args.path,
            namespace: 'levelo-public-asset',
          };
        }
        return null;
      });

      build.onLoad({ filter: /.*/, namespace: 'levelo-public-asset' }, (args) => {
        return {
          contents: `export default ${JSON.stringify(args.path)};`,
          loader: 'js',
        };
      });

      // Intercept JSX and TSX files
      build.onLoad({ filter: /\.[jt]sx$/ }, async (args) => {
        const source = await readFile(args.path, 'utf8');

        try {
          const transformedCode = await transformLeveloCode(source, args.path);
          return {
            contents: transformedCode,
            loader: 'jsx', // Fallback safety for any nested JSX
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

      // Intercept CSS files and dynamically inject them into the DOM <head>
      build.onLoad({ filter: /\.css$/ }, async (args) => {
        const cssContent = await readFile(args.path, 'utf8');
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
          loader: 'js',
        };
      });
    },
  };
}
