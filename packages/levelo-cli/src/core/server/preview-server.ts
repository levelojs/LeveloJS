// packages/levelo-cli/src/core/server/preview-server.ts
import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';
import { loadLeveloConfig } from '../../utils/config-loader.js';
import { MIME_TYPES } from '../../utils/mime-types.js';
import { brandBadge } from '../../utils/brand-tag.js';

interface PreviewServerOptions {
  cwd?: string;
  port?: number;
}

export async function startPreviewServer(options: PreviewServerOptions = {}) {
  const startTime = performance.now();
  const rootDir = options.cwd || process.cwd();
  const config = await loadLeveloConfig(rootDir);

  const port = options.port || config.web?.port || 6262;
  const relativeOutDir = config.web?.outDir || path.join('output', 'web');
  const distDir = path.resolve(rootDir, relativeOutDir);

  if (!fsSync.existsSync(distDir)) {
    throw new Error(
      `Production build directory not found at "${relativeOutDir}". Run "levelo build" first.`,
    );
  }

  const server = http.createServer(async (req, res) => {
    const reqPath = (req.url || '/').split('?')[0];
    const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
    const ext = path.extname(safePath).toLowerCase();

    const targetFile =
      safePath === '/' || safePath === '\\'
        ? path.join(distDir, 'index.html')
        : path.join(distDir, safePath);

    try {
      const stat = await fs.stat(targetFile);
      if (stat.isFile()) {
        const data = await fs.readFile(targetFile);
        const contentType =
          MIME_TYPES[path.extname(targetFile).toLowerCase()] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
        return;
      }
    } catch {
      // Fall through to SPA fallback if route has no file extension
    }

    if (ext) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`Not found: ${reqPath}`);
      return;
    }

    // SPA History Fallback
    try {
      const indexHtml = await fs.readFile(path.join(distDir, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(indexHtml);
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Missing index.html in build output.');
    }
  });

  server.listen(port, () => {
    const duration = Math.round(performance.now() - startTime);
    console.log();
    console.log(
      `  ${brandBadge('LEVELOJS')} ${pc.dim('preview ready in')} ${pc.reset(`${duration} ms`)}`,
    );
    console.log();
    console.log(
      `  ${pc.green('➜')}  ${pc.bold('Local:')}   ${pc.cyan(`http://localhost:${port}/`)}`,
    );
    console.log(
      `  ${pc.green('➜')}  ${pc.dim('Target:')}  ${pc.bold(relativeOutDir.replace(/\\/g, '/'))}`,
    );
    console.log();
  });

  return server;
}