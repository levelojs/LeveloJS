// packages/levelo-cli/src/core/bundler/native-bundler.ts
import esbuild from 'esbuild';
import path from 'node:path';
import fs from 'node:fs/promises';
import pc from 'picocolors';
import { transformLeveloCode, type TargetPlatform } from '../compiler/babel.js';

export async function buildNativeBundle(
  rootDir: string = process.cwd(),
  platform: TargetPlatform = 'windows',
): Promise<string> {
  const entryPoint = path.join(rootDir, 'src', 'main.tsx');
  const outDir = path.join(rootDir, 'output', 'native', platform);
  const outFile = path.join(outDir, 'bundle.js');

  await fs.mkdir(outDir, { recursive: true });

  const startTime = performance.now();

  try {
    await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      outfile: outFile,
      format: 'esm',
      platform: 'neutral',
      target: 'es2022',
      sourcemap: false,
      minify: false,
      // Resolve "levelojs" through the "native" condition in package.json exports
      conditions: ['native', 'import', 'default'],
      // neutral platform has no default main fields, so set them explicitly
      // Ignore the app's tsconfig "paths" so package.json exports decide resolution
      tsconfigRaw: { compilerOptions: {} },
      mainFields: ['module', 'main'],
      plugins: [
        {
          name: 'levelo-native-resolver',
          setup(build) {
            // Native builds ignore CSS imports
            build.onResolve({ filter: /\.css$/ }, (args) => {
              return { path: args.path, namespace: 'empty-css' };
            });
            build.onLoad({ filter: /.*/, namespace: 'empty-css' }, () => {
              return { contents: '', loader: 'js' };
            });

            // Transform user source files (JSX -> h() calls)
            build.onLoad({ filter: /\.(tsx|jsx|ts|js)$/ }, async (args) => {
              if (args.path.includes('node_modules')) {
                return undefined;
              }

              const source = await fs.readFile(args.path, 'utf8');
              const transformed = await transformLeveloCode(source, args.path, platform);

              return {
                contents: transformed,
                loader: 'js',
              };
            });
          },
        },
      ],
    });

    const duration = Math.round(performance.now() - startTime);
    console.log(pc.green(`✔ Native bundle generated in ${duration}ms -> dist-native/bundle.js`));
    return outFile;
  } catch (err: any) {
    console.error(pc.red(`✖ Failed to build native bundle: ${err.message}`));
    throw err;
  }
}
