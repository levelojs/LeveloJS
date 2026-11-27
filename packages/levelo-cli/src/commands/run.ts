// packages/levelo-cli/src/commands/run.ts

import { spawn } from 'node:child_process';
import path from 'node:path';
import pc from 'picocolors';
import { buildNativeBundle } from '../core/bundler/native-bundler.js';
import { buildWebBundle } from '../core/bundler/web-bundler.js';
import { startDevServer } from '../core/server/dev-server.js';
import { startPreviewServer } from '../core/server/preview-server.js';
import { loadLeveloConfig } from '../utils/config-loader.js';

interface CommandOptions {
  platform: 'windows' | 'web' | 'android';
  port?: number;
}

// resolve and validate port from CLI flag, config, or default
function resolvePort(cliPort: number | undefined, configPort: number | undefined): number {
  const rawPort = cliPort ?? configPort ?? 6262;
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port "${rawPort}". Port must be an integer between 1 and 65535.`);
  }

  if (port < 1024) {
    console.log(
      pc.yellow(
        `⚠ Port ${port} is a privileged/system port (1-1023). Use 1024-65535 if binding fails.`,
      ),
    );
  }

  return port;
}

export async function runDevCommand(options: CommandOptions): Promise<void> {
  const platform = options.platform || 'web';
  const projectRoot = process.cwd();
  const config = await loadLeveloConfig(projectRoot);
  const resolvedPort = resolvePort(options.port, config.web?.port);

  if (platform === 'web') {
    console.log(pc.bold(`\n⚡ Starting LeveloJS Web Engine...\n`));
    await startDevServer({
      cwd: projectRoot,
      port: Number(resolvedPort),
    });
  } else if (platform === 'windows') {
    console.log(pc.bold(`\n⚡ Building Native Bundle for Windows...\n`));
    await buildNativeBundle(projectRoot);

    console.log(pc.bold(`\n🚀 Launching Levelo Windows Host Engine...\n`));

    // Spawn cargo run pointing to the windows host package
    const cargo = spawn('cargo', ['run', '-p', 'levelo-windows'], {
      cwd: path.resolve(projectRoot, '..'),
      stdio: 'inherit',
      shell: true,
    });

    cargo.on('error', (err) => {
      console.error(pc.red(`✖ Failed to start Windows Host: ${err.message}`));
    });
  } else {
    console.log(pc.yellow(`⚠ ${platform} platform is coming soon!`));
  }
}

export async function runBuildCommand(options: CommandOptions): Promise<void> {
  const platform = options.platform || 'web';
  const projectRoot = process.cwd();

  if (platform === 'web') {
    console.log(`\n📦 Compiling LeveloJS Web Bundle...\n`);
    await buildWebBundle(projectRoot);
  } else if (platform === 'windows') {
    console.log(pc.bold(`\n📦 Compiling LeveloJS Windows Native Bundle...\n`));
    await buildNativeBundle(projectRoot);
  } else {
    console.log(pc.yellow(`\\n⚠ ${platform} platform build is coming soon!\n`));
  }
}

export async function runPreviewCommand(options: { port?: number }): Promise<void> {
  const projectRoot = process.cwd();
  const config = await loadLeveloConfig(projectRoot);
  const resolvedPort = resolvePort(options.port, config.web?.port);
  await startPreviewServer({
    cwd: process.cwd(),
    port: resolvedPort,
  });
}
