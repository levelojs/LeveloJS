// packages/levelo-cli/src/core/bundler/web-bundler.ts
import esbuild from 'esbuild';
import path from 'node:path';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import pc from 'picocolors';
import { leveloWebPlugin } from '../plugins/web-plugin.js';
import { loadLeveloConfig } from '../../utils/config-loader.js';
import { brandBadge, brandTag } from '../../utils/brand-tag.js';

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

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} kB`;
    return `${(kb / 1024).toFixed(2)} MB`;
}

export async function buildWebBundle(rootDir: string = process.cwd()): Promise<string> {
    const startTime = performance.now();
    const config = await loadLeveloConfig(rootDir);
    const relativeOutDir = config.web?.outDir || path.join('output', 'web');
    const outDir = path.resolve(rootDir, relativeOutDir);
    const entryPoint = resolveLaunchEntryPath(rootDir);

    console.log();
    console.log(`  ${brandBadge('LEVELOJS')} ${pc.dim('building for production (web)...')}`);
    console.log();

    // Clean previous output directory
    await fs.rm(outDir, { recursive: true, force: true });
    await fs.mkdir(outDir, { recursive: true });

    // Copy static assets from public/ into output root
    const publicDir = path.join(rootDir, 'public');
    await copyDirRecursive(publicDir, outDir);

    try {
        const buildResult = await esbuild.build({
            entryPoints: [entryPoint],
            bundle: true,
            outdir: outDir,
            entryNames: 'assets/index.[hash]',
            chunkNames: 'assets/chunk.[hash]',
            assetNames: 'assets/[name].[hash]',
            publicPath: '/',
            format: 'esm',
            platform: 'browser',
            target: 'es2022',
            minify: config.web?.minify ?? true,
            sourcemap: config.web?.minify ?? false,
            metafile: true,
            loader: {
                '.svg': 'file',
                '.png': 'file',
                '.jpg': 'file',
                '.jpeg': 'file',
                '.webp': 'file',
                '.gif': 'file',
                '.ico': 'file',
                '.apng': 'file',
                '.avif': 'file',
                '.mp4': 'file',
                '.webm': 'file',
                '.ogg': 'file',
                '.mp3': 'file',
                '.wav': 'file',
                '.flac': 'file',
                '.aac': 'file',
                '.m4a': 'file',
                '.woff': 'file',
                '.woff2': 'file',
                '.ttf': 'file',
                '.otf': 'file',
                '.eot': 'file',
                '.pdf': 'file',
                '.xml': 'file',
                '.txt': 'file',
            },
            plugins: [leveloWebPlugin(rootDir, { isProduction: true })],
        });

        // Discover generated JS and CSS entry files from metafile
        const outputs = buildResult.metafile?.outputs || {};
        let jsEntryHref = '';
        const cssEntryHrefs: string[] = [];
        const generatedStats: { file: string; size: number }[] = [];

        for (const [outputPath, info] of Object.entries(outputs)) {
            const absOutFile = path.resolve(outputPath);
            const relToOutDir = path.relative(outDir, absOutFile).replace(/\\/g, '/');
            generatedStats.push({ file: relToOutDir, size: info.bytes });

            if (info.entryPoint && relToOutDir.endsWith('.js')) {
                jsEntryHref = `/${relToOutDir}`;
            } else if (relToOutDir.endsWith('.css')) {
                cssEntryHrefs.push(`/${relToOutDir}`);
            }
        }

        if (!jsEntryHref) {
            throw new Error('Failed to locate bundled JavaScript entry output.');
        }

        // Build production index.html with injected CSS & JS tags
        const cssLinksHtml = cssEntryHrefs
            .map((href) => `<link rel="stylesheet" crossorigin href="${href}" />`)
            .join('');

        const productionHtml = `<!doctype html><html><head><meta charset="UTF-8" />${cssLinksHtml}</head><body><script type="module" crossorigin src="${jsEntryHref}"></script></body></html>`;

        const indexHtmlPath = path.join(outDir, 'index.html');
        await fs.writeFile(indexHtmlPath, productionHtml, 'utf8');
        generatedStats.unshift({
            file: 'index.html',
            size: Buffer.byteLength(productionHtml, 'utf8'),
        });

        // Print Vite-style build summary
        const displayOutDir = relativeOutDir.replace(/\\/g, '/');
        for (const stat of generatedStats) {
            console.log(
                `  ${pc.dim(`${displayOutDir}/`)}${pc.cyan(stat.file.padEnd(28))} ${pc.bold(pc.green(formatSize(stat.size)))}`,
            );
        }

        const duration = Math.round(performance.now() - startTime);
        console.log();
        console.log(`  ${pc.green('✔')} Built in ${pc.bold(`${duration}ms`)}`);
        console.log();

        return outDir;
    } catch (err: any) {
        console.error(pc.red(`${brandTag} Production Build Failed: ${err.message}`));
        throw err;
    }
}
