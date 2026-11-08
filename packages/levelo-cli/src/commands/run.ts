import path from "node:path";
import pc from 'picocolors';
import { startDevServer } from "../core/server/dev-server.js";

interface RunOptions {
    device: "windows" | "web" | "android";
    port?: number;
}

export async function runCommand(options: RunOptions): Promise<void> {
    const device = options.device || "web";
    const port = options.port || 6262;
    const projectRoot = process.cwd();

    if (device === "web") {
        console.log(pc.cyan(`\n⚡ Starting LeveloJS Web Engine...\n`));
        await startDevServer({
            cwd: projectRoot,
            port: Number(port)
        });
    } else {
        console.log(pc.cyan(`\n⚡ Starting LeveloJS Native Engine for ${device}...\n`));
        console.log(pc.yellow(`⚠ ${device} native pipeline integration is coming up next!`));
    }
}