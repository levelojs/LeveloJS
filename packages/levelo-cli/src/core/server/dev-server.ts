import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import fsSync from "node:fs";
import esbuild from "esbuild";
import pc from "picocolors";
import { WebSocketServer, WebSocket } from "ws";
import { leveloWebPlugin } from "../plugins/web-plugin.js";

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

export async function startDevServer(options: DevServerOptions = {}) {
    const rootDir = options.cwd || process.cwd();
    const port = options.port || 6262;

    const server = http.createServer(async (req, res) => {
        let reqPath = (req.url || "/").split("?")[0];

        // 1. Serve index.html on root request
        if (reqPath === "/" || reqPath === "/index.html") {
            try {
                const htmlPath = path.join(rootDir, "index.html");
                let html = await fs.readFile(htmlPath, "utf-8");

                // Automatically inject the WS client script before closing tag
                if (html.includes("</body>")) {
                    html = html.replace("</body>", `${WS_CLIENT_SCRIPT}</body>`);
                } else {
                    html += WS_CLIENT_SCRIPT;
                }

                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                res.end(html);
                return;
            } catch {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("index.html not found in project root.");
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
                    target: "es2022",
                    sourcemap: "inline",
                    plugins: [leveloWebPlugin()],
                });

                const outputCode = buildResult.outputFiles?.[0]?.text || "";
                res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
                res.end(outputCode);
                return;
            } catch (err: any) {
                console.error(pc.red(`[Levelo Bundler Error]: ${err.message}`));
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
    let debounceTimer: NodeJS.Timeout | null = null;
    const watchTarget = path.join(rootDir, 'src');

    if (fsSync.existsSync(watchTarget)) {
        const watcher = fsSync.watch(watchTarget, {recursive: true}, (_event, filename) => {
            if (!filename) return;
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                console.log(pc.yellow(`[Levelo] Changed: src/${filename} -> reloading browser...`));
                broadcastReload();
            }, 100);
        });

        server.on("close", () => watcher.close());
    }

    server.listen(port, () => {
        console.log(pc.green(`\n✔ LeveloJS Web Server ready!`));
        console.log(pc.cyan(`  ➜ Local: `) + pc.green(`http://localhost:${port}/`));
        console.log(pc.gray(`  ➜ Root:  `) + pc.white(rootDir) + `\n`);
    });

    return { server, wss };
}