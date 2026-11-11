import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import fsSync from "node:fs";
import esbuild from "esbuild";
import pc from "picocolors";
import { WebSocketServer, WebSocket } from "ws";
import { leveloWebPlugin } from "../plugins/web-plugin.js";

// LeveloJS Violet theme brand color (#7C6BF6)
const brandColor = (str: string) => `\x1b[38;2;124;107;246m${str}\x1b[0m`;
const brandBadge = (str: string) => `\x1b[48;2;124;107;246m\x1b[30m\x1b[1m ${str} \x1b[0m`;
const brandTag = brandColor("[LEVELOJS]");

interface DevServerOptions {
    cwd?: string;
    port?: number;
}

const MIME_TYPES: Record<string, string> = {
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".ts": "text/javascript",
    ".tsx": "text/javascript",
    ".jsx": "text/javascript",
    ".css": "text/css",
    ".html": "text/html",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon",
};

// Client script that connects to Levelo WebSocket server
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

// =========================================================
// Config Loader & Virtual HTML Generator
// =========================================================
async function getFreshAppConfig(rootDir: string) {
    const tsConfig = path.join(rootDir, "app.config.ts");
    const jsConfig = path.join(rootDir, "app.config.js");
    const configPath = fsSync.existsSync(tsConfig) ? tsConfig : jsConfig;
    if (!fsSync.existsSync(configPath)) {
        return { name: "LeveloJS App", web: { title: "LeveloJS App" } };
    }

    try {
        const result = await esbuild.build({
            entryPoints: [configPath],
            bundle: true,
            write: false,
            format: "esm",
            platform: "node",
        });
        const code = result.outputFiles[0].text;
        const base64 = Buffer.from(code).toString("base64");
        const module = await import(`data:text/javascript;base64,${base64}`);
        return module.default || module;
    } catch (err: any) {
        console.error(pc.red(`[Levelo Config Error]: ${err.message}`));
        return { name: "LeveloJS App", web: { title: "LeveloJS App" } };
    }
}

function generateVirtualHtml(config: any): string {
    const web = config.web || {};
    const title = web.title || config.name || "LeveloJS App";
    const lang = web.lang || "en";
    const icon = config.icon ? `<link rel="icon" href="${config.icon}" />` : "";

    const metaTags = (web.meta || [])
        .map((m: any) => {
            if (m.name) return `<meta name="${m.name}" content="${m.content}" />`;
            if (m.property) return `<meta property="${m.property}" content="${m.content}" />`;
            return "";
        })
        .filter(Boolean)
        .join("\n    ");

    const linkTags = (web.links || [])
        .map((l: any) => `<link rel="${l.rel}" href="${l.href}" ${l.type ? `type="${l.type}"` : ""} />`)
        .join("\n    ");

    return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${icon}
    <title>${title}</title>
    ${metaTags}
    ${linkTags}
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.tsx"></script>
    ${WS_CLIENT_SCRIPT}
  </body>
</html>`;
}

// =========================================================
// Dev Server Implementation
// =========================================================
export async function startDevServer(options: DevServerOptions = {}) {
    const startTime = performance.now();
    const rootDir = options.cwd || process.cwd();
    const port = options.port || 6262;

    const server = http.createServer(async (req, res) => {
        let reqPath = (req.url || "/").split("?")[0];

        // Serve Virtual HTML on root request (Zero-HTML Architecture)
        if (reqPath === "/" || reqPath === "/index.html") {
            try {
                const config = await getFreshAppConfig(rootDir);
                const html = generateVirtualHtml(config);

                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                res.end(html);
                return;
            } catch (err: any) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end(`Internal Server Error: ${err.message}`);
                return;
            }
        }

        const ext = path.extname(reqPath).toLowerCase();

        // Dynamic compile & bundle on-the-fly for script files (Resolves "levelojs" bare specifiers)
        if (ext === ".ts" || ext === ".tsx" || ext === ".jsx" || ext === ".js") {
            const fullSourcePath = path.join(rootDir, reqPath);
            try {
                const buildResult = await esbuild.build({
                    entryPoints: [fullSourcePath],
                    bundle: true,
                    write: false,
                    format: "esm",
                    platform: 'browser',
                    target: "es2022",
                    sourcemap: "inline",
                    plugins: [leveloWebPlugin()],
                });

                const outputCode = buildResult.outputFiles?.[0]?.text || "";
                res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
                res.end(outputCode);
                return;
            } catch (err: any) {
                console.error(pc.red(`${brandTag} Bundler Error: ${err.message}`));
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end(err.message);
                return;
            }
        }

        // Static asset serving (root or public/ folder)
        const candidates = [
            path.join(rootDir, reqPath),
            path.join(rootDir, "public", reqPath),
        ];

        for (const filePath of candidates) {
            try {
                const data = await fs.readFile(filePath);
                const contentType = MIME_TYPES[ext] || "application/octet-stream";
                res.writeHead(200, { "Content-Type": contentType });
                res.end(data);
                return;
            } catch {
                // Continue checking next candidate
            }
        }

        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end(`File not found: ${reqPath}`);
    });

    // WebSocket Server on the same HTTP instance
    const wss = new WebSocketServer({ server });
    const clients = new Set<WebSocket>();

    wss.on("connection", (ws) => {
        clients.add(ws);
        ws.on("close", () => clients.delete(ws));
    });

    function broadcastReload() {
        for (const client of clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send("reload");
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
            console.log(`${pc.dim(currentTime)} ${brandTag} Changed: ${pc.green(filename)} -> reloading browser...`);
            broadcastReload();
        }, 100);
    };

    // Watch src/
    const watchTarget = path.join(rootDir, "src");
    let srcWatcher: fsSync.FSWatcher | null = null;
    if (fsSync.existsSync(watchTarget)) {
        srcWatcher = fsSync.watch(watchTarget, { recursive: true }, (_event, filename) => {
            if (filename) triggerReload(`src/${filename}`);
        });
    }

    // Watch app.config.ts
    const configTarget = fsSync.existsSync(path.join(rootDir, "app.config.ts"))
        ? path.join(rootDir, "app.config.ts")
        : path.join(rootDir, "app.config.js");
    let configWatcher: fsSync.FSWatcher | null = null;
    if (fsSync.existsSync(configTarget)) {
        configWatcher = fsSync.watch(configTarget, () => {
            triggerReload(path.basename(configTarget));
        });
    }

    server.on("close", () => {
        srcWatcher?.close();
        configWatcher?.close();
    });

    server.listen(port, () => {
        const startupDuration = Math.round(performance.now() - startTime);
        console.log();
        console.log(
            `  ${brandBadge("LEVELOJS")} ${pc.dim("ready in")} ${pc.reset(`${startupDuration} ms`)}`
        );
        console.log();
        console.log(`  ${pc.green("➜")}  ${pc.bold("Local:")}   ${pc.cyan(`http://localhost:${port}/`)}`);
        console.log(`  ${pc.green("➜")}  ${pc.dim("Network:")} ${pc.dim(`use ${pc.bold("--host")} to expose`)}`);
        console.log(`  ${pc.green("➜")}  ${pc.dim("Root:")}    ${pc.bold(rootDir)}`);
        console.log();
    });

    return { server, wss };
}