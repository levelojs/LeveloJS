import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import esbuild from 'esbuild';
import pc from 'picocolors';
import { WebSocket, WebSocketServer } from 'ws';
import { loadLeveloConfig } from '../../utils/config-loader.js';
import { MIME_TYPES } from '../../utils/mime-types.js';
import { leveloWebPlugin } from '../plugins/web-plugin.js';

// LeveloJS Violet theme brand color (#7C6BF6)
const brandColor = (str: string) => `\x1b[38;2;124;107;246m${str}\x1b[0m`;
const brandBadge = (str: string) => `\x1b[48;2;124;107;246m\x1b[30m\x1b[1m ${str} \x1b[0m`;
const brandTag = brandColor('[LEVELOJS]');

interface DevServerOptions {
  cwd?: string;
  port?: number;
}

const LAUNCH_CANDIDATES = ['launch.tsx', 'launch.jsx', 'launch.ts', 'launch.js'];
function resolveLaunchEntry(rootDir: string): string {
  for (const file of LAUNCH_CANDIDATES) {
    if (fsSync.existsSync(path.join(rootDir, file))) {
      return `/${file}`;
    }
  }
  return '/launch.tsx';
}

// Client script that connects to Levelo WebSocket server
const WS_CLIENT_SCRIPT = `
<script>
  (() => {
    try {
      const socket = new WebSocket('ws://' + window.location.host);
      socket.onmessage = (event) => {
        if (event.data === 'reload') {
          console.log('[Levelo] Reloading page...');
          window.location.reload();
        }
      };
      socket.onclose = () => {
        console.warn('[Levelo] Dev server disconnected.');
      };
    } catch (e) {}
  })();
</script>
`;

// Minimal bootstrap HTML shell that mounts /launch.tsx
function generateBootstrapHtml(rootDir: string): string {
  const launchSrc = resolveLaunchEntry(rootDir);
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    ${WS_CLIENT_SCRIPT}
  </head>
  <body>
    <script
      type="module"
      src="${launchSrc}"
      onerror="console.error('[Levelo] Failed to load ${launchSrc}. Make sure ${launchSrc} exists at the project root.')"
    ></script>
    <script>
      window.addEventListener('load', () => {
        setTimeout(() => {
          if (!window.__LEVELO_MOUNTED__) {
            console.warn('[Levelo] Application did not mount. Ensure launch(() => <html>...</html>) is called in ${launchSrc}');
          }
        }, 300);
      });
    </script>
  </body>
</html>`;
}

// =========================================================
// Dev Server Implementation
// =========================================================
export async function startDevServer(options: DevServerOptions = {}) {
  const startTime = performance.now();
  const rootDir = options.cwd || process.cwd();
  const config = await loadLeveloConfig(rootDir);
  const port = options.port || config.web?.port || 6262;

  const server = http.createServer(async (req, res) => {
    const reqPath = (req.url || '/').split('?')[0];
    const ext = path.extname(reqPath).toLowerCase();

    // Serve minimal bootstrap HTML on root request
    if (reqPath === '/' || reqPath === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(generateBootstrapHtml(rootDir));
      return;
    }

    // Dynamic compile & bundle on-the-fly for script files (Resolves "levelojs" bare specifiers)
    if (ext === '.ts' || ext === '.tsx' || ext === '.jsx' || ext === '.js') {
      const fullSourcePath = path.join(rootDir, reqPath);
      try {
        const buildResult = await esbuild.build({
          entryPoints: [fullSourcePath],
          bundle: true,
          write: false,
          format: 'esm',
          platform: 'browser',
          target: 'es2022',
          sourcemap: 'inline',
          plugins: [leveloWebPlugin(rootDir)],
        });

        const outputCode = buildResult.outputFiles?.[0]?.text || '';
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
        res.end(outputCode);
        return;
      } catch (err: any) {
        console.error(pc.red(`${brandTag} Bundler Error: ${err.message}`));
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(err.message);
        return;
      }
    }

    // Static asset serving (root or public/ folder) when file extension is present
    if (ext) {
      const candidates = [path.join(rootDir, reqPath), path.join(rootDir, 'public', reqPath)];

      for (const filePath of candidates) {
        try {
          const data = await fs.readFile(filePath);
          const contentType = MIME_TYPES[ext] || 'application/octet-stream';
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(data);
          return;
        } catch {
          // Continue checking next candidate
        }
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`File not found: ${reqPath}`);
      return;
    }

    // SPA History Fallback for extensionless routes (e.g., /about, /user/42)
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(generateBootstrapHtml(rootDir));
  });

  // WebSocket Server on the same HTTP instance
  const wss = new WebSocketServer({ server });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });

  function broadcastReload() {
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send('reload');
      }
    }
  }

  // Watch source directory with debounce
  // Watch source directory & app.config.ts with debounce
  let debounceTimer: NodeJS.Timeout | null = null;
  const triggerReload = (filename: string) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const currentTime = new Date().toLocaleTimeString();
      console.log(
        `${pc.dim(currentTime)} ${brandTag} Changed: ${pc.green(filename)} -> reloading browser...`,
      );
      broadcastReload();
    }, 100);
  };

  // Watch src/
  const watchTarget = path.join(rootDir, 'src');
  let srcWatcher: fsSync.FSWatcher | null = null;
  if (fsSync.existsSync(watchTarget)) {
    srcWatcher = fsSync.watch(watchTarget, { recursive: true }, (_event, filename) => {
      if (filename) triggerReload(`src/${filename}`);
    });
  }

  // Watch app.config.ts
  const configTarget = fsSync.existsSync(path.join(rootDir, 'app.config.ts'))
    ? path.join(rootDir, 'app.config.ts')
    : path.join(rootDir, 'app.config.js');
  let configWatcher: fsSync.FSWatcher | null = null;
  if (fsSync.existsSync(configTarget)) {
    configWatcher = fsSync.watch(configTarget, () => {
      triggerReload(path.basename(configTarget));
    });
  }

  // Watch launch.tsx
  const activeLaunchFile = LAUNCH_CANDIDATES.find((file) =>
    fsSync.existsSync(path.join(rootDir, file)),
  );
  let launchWatcher: fsSync.FSWatcher | null = null;
  if (activeLaunchFile) {
    launchWatcher = fsSync.watch(path.join(rootDir, activeLaunchFile), () => {
      triggerReload(activeLaunchFile);
    });
  }

  server.on('close', () => {
    srcWatcher?.close();
    configWatcher?.close();
    launchWatcher?.close();
  });

  server.listen(port, () => {
    const startupDuration = Math.round(performance.now() - startTime);
    console.log();
    console.log(
      `  ${brandBadge('LEVELOJS')} ${pc.dim('ready in')} ${pc.reset(`${startupDuration} ms`)}`,
    );
    console.log();
    console.log(
      `  ${pc.green('➜')}  ${pc.bold('Local:')}   ${pc.cyan(`http://localhost:${port}/`)}`,
    );
    console.log(
      `  ${pc.green('➜')}  ${pc.dim('Network:')} ${pc.dim(`use ${pc.bold('--host')} to expose`)}`,
    );
    console.log(`  ${pc.green('➜')}  ${pc.dim('Root:')}    ${pc.bold(rootDir)}`);
    console.log();
  });

  return { server, wss };
}
