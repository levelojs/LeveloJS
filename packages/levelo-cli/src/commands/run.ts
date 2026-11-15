// packages/levelo-cli/src/commands/run.ts
import path from 'node:path';
import { spawn } from 'node:child_process';
import pc from 'picocolors';
import { startDevServer } from '../core/server/dev-server.js';
import { buildWebBundle } from '../core/bundler/web-bundler.js';
import { buildNativeBundle } from '../core/bundler/native-bundler.js';
import { startPreviewServer } from '../core/server/preview-server.js';

interface CommandOptions {
  platform: 'windows' | 'web' | 'android';
  port?: number;
}

export async function runDevCommand(options: CommandOptions): Promise<void> {
  const platform = options.platform || 'web';
  const port = options.port || 6262;
  const projectRoot = process.cwd();

  if (platform === 'web') {
    console.log(pc.bold(`\n⚡ Starting LeveloJS Web Engine...\n`));
    await startDevServer({
      cwd: projectRoot,
      port: Number(port),
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
  await startPreviewServer({
    cwd: process.cwd(),
    ...(options.port ? { port: Number(options.port) } : {}),
  });
}