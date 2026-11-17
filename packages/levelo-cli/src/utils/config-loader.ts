import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import esbuild from 'esbuild';
import pc from 'picocolors';
import type { ResolvedLeveloConfig } from '../core/bundler/type/web-bundler-type.js';
import { brandTag } from './brand-tag.js';

export async function loadLeveloConfig(rootDir: string): Promise<ResolvedLeveloConfig> {
  const tsConfigPath = path.join(rootDir, 'app.config.ts');
  const jsConfigPath = path.join(rootDir, 'app.config.js');
  const configPath = fsSync.existsSync(tsConfigPath)
    ? tsConfigPath
    : fsSync.existsSync(jsConfigPath)
      ? jsConfigPath
      : null;

  if (!configPath) return {};

  try {
    // Compile config on-the-fly with esbuild so both .ts and .js configs work seamlessly
    const result = await esbuild.build({
      entryPoints: [configPath],
      bundle: false,
      write: false,
      format: 'esm',
      platform: 'node',
      target: 'node20',
    });

    const compiledCode = result.outputFiles?.[0]?.text || '';
    const tempConfigFile = path.join(rootDir, `.levelo.config.${Date.now()}.mjs`);
    await fs.writeFile(tempConfigFile, compiledCode, 'utf8');

    try {
      const imported = await import(pathToFileURL(tempConfigFile).href);
      return (imported.default || {}) as ResolvedLeveloConfig;
    } finally {
      await fs.rm(tempConfigFile, { force: true });
    }
  } catch (err: any) {
    console.warn(
      pc.yellow(`${brandTag} Warning: Failed to load ${path.basename(configPath)}: ${err.message}`),
    );
    return {};
  }
}
