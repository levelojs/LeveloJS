import fsSync from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { transformLeveloCode } from '../compiler/babel.js';

export interface LeveloWebPluginOptions {
  isProduction?: boolean;
}

export function leveloWebPlugin(rootDir: string = process.cwd(), options: LeveloWebPluginOptions = {}): Plugin {
  const { isProduction = false } = options;
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

      // In development, inject CSS dynamically into DOM <head>.
      // In production, let esbuild bundle & extract separate minified .css files.
      if (!isProduction) {
        build.onLoad({ filter: /\.css$/ }, async (args) => {
          const cssContent = await readFile(args.path, 'utf8');
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
      }
    },
  };
}
