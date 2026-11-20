// packages/levelo-cli/src/core/bundler/native-bundler.ts
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import esbuild from 'esbuild';
import pc from 'picocolors';
import { type TargetPlatform, transformLeveloCode } from '../compiler/babel.js';

const LAUNCH_CANDIDATES = ['launch.tsx', 'launch.jsx', 'launch.ts', 'launch.js'];

function resolveLaunchEntryPath(rootDir: string): string {
  for (const file of LAUNCH_CANDIDATES) {
    const fullPath = path.join(rootDir, file);
    if (fsSync.existsSync(fullPath)) {
      return fullPath;
    }
  }
  throw new Error(
    `Could not find launch entry file (${LAUNCH_CANDIDATES.join(', ')}) in ${rootDir}`,
  );
}

async function copyDirRecursive(srcDir: string, destDir: string): Promise<void> {
  if (!fsSync.existsSync(srcDir)) return;
  await fs.mkdir(destDir, { recursive: true });
  const entries = await fs.readdir(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

const ASSET_FILTER =
  /\.(svg|png|jpg|jpeg|webp|gif|ico|apng|avif|mp4|webm|ogg|mp3|wav|flac|aac|m4a|woff|woff2|ttf|otf|eot)$/i;

export async function buildNativeBundle(
  rootDir: string = process.cwd(),
  platform: TargetPlatform = 'windows',
  isProduction: boolean = false,
): Promise<string> {
  const entryPoint = resolveLaunchEntryPath(rootDir);
  const outDir = path.join(rootDir, 'output', 'native', platform);
  const outFile = path.join(outDir, 'bundle.js');
  const publicDir = path.join(rootDir, 'public');

  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  // Copy static files from public/ into output/native/<platform>/
  await copyDirRecursive(publicDir, outDir);

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
      define: {
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      },
      // Resolve "levelojs" through the "native" condition in package.json exports
      conditions: ['native', 'import', 'default'],
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

            // Resolve root-relative public assets (e.g., '/levelojs.svg')
            build.onResolve({ filter: /^\/.*/ }, (args) => {
              if (!ASSET_FILTER.test(args.path)) return undefined;
              const cleanRel = args.path.slice(1);
              const candidate = path.join(publicDir, cleanRel);
              return {
                path: candidate,
                namespace: 'native-asset',
                pluginData: { publicUrl: args.path },
              };
            });

            // Resolve relative asset imports (e.g., './assets/logo.png')
            build.onResolve({ filter: ASSET_FILTER }, (args) => {
              const resolvedPath = path.resolve(args.resolveDir, args.path);
              return {
                path: resolvedPath,
                namespace: 'native-asset',
              };
            });

            // Copy imported assets & return resolved path string inside bundle.js
            build.onLoad({ filter: /.*/, namespace: 'native-asset' }, async (args) => {
              if (args.pluginData?.publicUrl) {
                return {
                  contents: `export default ${JSON.stringify(args.pluginData.publicUrl)};`,
                  loader: 'js',
                };
              }

              const assetsOutDir = path.join(outDir, 'assets');
              await fs.mkdir(assetsOutDir, { recursive: true });
              const fileName = path.basename(args.path);
              await fs.copyFile(args.path, path.join(assetsOutDir, fileName));

              return {
                contents: `export default ${JSON.stringify(`/assets/${fileName}`)};`,
                loader: 'js',
              };
            });

            // Transform user source files (JSX -> h() calls)
            build.onLoad({ filter: /\.(tsx|jsx|ts|js)$/ }, async (args) => {
              if (args.path.includes('node_modules')) {
                return undefined;
              }

              let source = await fs.readFile(args.path, 'utf8');

              // Strip <head>...</head> subtree for native builds so head/title/meta tags
              // never turn into native UI nodes or stray text.
              source = source.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '');
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
    console.log(pc.green(`✔ Native bundle generated in ${duration}ms -> ${outDir}`));
    return outFile;
  } catch (err: any) {
    console.error(pc.red(`✖ Failed to build native bundle: ${err.message}`));
    throw err;
  }
}
