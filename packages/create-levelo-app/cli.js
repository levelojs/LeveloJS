#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import ora from 'ora';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SKIP = new Set([
  'node_modules',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  '.git',
  'dist',
  'output',
  '.levelo',
]);

const templates = [
  {
    value: 'vite-tsx',
    label: 'Vite + TypeScript',
    hint: 'Recommended - Stable, Vite powered',
    folder: path.join('vite', 'tsx'),
  },
  {
    value: 'vite-jsx',
    label: 'Vite + JavaScript',
    hint: 'Stable, Vite powered, no TypeScript',
    folder: path.join('vite', 'jsx'),
  },
  {
    value: 'levelo-tsx',
    label: 'Levelo CLI + TypeScript',
    hint: 'Early preview - Multi-platform, no Vite config',
    folder: path.join('levelo-cli', 'tsx'),
  },
  {
    value: 'levelo-jsx',
    label: 'Levelo CLI + JavaScript',
    hint: 'Early preview - Multi-platform, no TypeScript',
    folder: path.join('levelo-cli', 'jsx'),
  },
];

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }

  for (const element of fs.readdirSync(from)) {
    if (SKIP.has(element)) continue;
    const sourcePath = path.join(from, element);
    const destPath = path.join(to, element);
    if (fs.lstatSync(sourcePath).isDirectory()) {
      copyFolderSync(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

async function main() {
  console.log('');
  p.intro(chalk.bgHex('#a78bfa').bold.white(' Levelo JS Framework '));

  // ---------- Package Manager ----------
  const userAgent = process.env.npm_config_user_agent;

  let packageManager = 'npm';

  if (userAgent?.startsWith('pnpm/')) {
    packageManager = 'pnpm';
  } else if (userAgent?.startsWith('yarn/')) {
    packageManager = 'yarn';
  } else if (userAgent?.startsWith('bun/')) {
    packageManager = 'bun';
  }

  const installCmd = packageManager === 'npm'
    ? 'npm install --no-audit --no-fund'
    : packageManager === 'pnpm'
    ? 'pnpm install --allow-build esbuild'
    : `${packageManager} install`;

  const runCmd = packageManager === 'npm'
    ? 'npm run dev'
    : `${packageManager} dev`;

  // ---------- Args ----------
  const args = process.argv.slice(2);
  const templateFlagIndex = args.indexOf('--template');
  const templateFlag = templateFlagIndex !== -1 ? args[templateFlagIndex + 1] : null;
  const noInstall = args.includes('--no-install');

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage:
  npx create-levelo-app <project-name>
  npx create-levelo-app <project-name> --template vite-tsx
  npx create-levelo-app . --template levelo-tsx

Templates:
  vite-tsx    Vite + TypeScript (Recommended)
  vite-jsx    Vite + JavaScript
  levelo-tsx  Levelo CLI + TypeScript (Early preview)
  levelo-jsx  Levelo CLI + JavaScript (Early preview)
`);
    process.exit(0);
  }

  let targetArg = args.find((a) => !a.startsWith('--') && a !== templateFlag);

  if (!targetArg) {
    targetArg = await p.text({
      message: 'Where should we create your Levelo project?',
      placeholder: './my-levelo-app',
      defaultValue: './my-levelo-app',
      validate(value) {
        if (value.trim().length === 0) return 'Directory path cannot be empty!';
      },
    });

    if (p.isCancel(targetArg)) {
      p.cancel('Operation cancelled.');
      process.exit(0);
    }
  }

  const projectDir = targetArg === '.' ? process.cwd() : path.resolve(process.cwd(), targetArg);
  const projectName = path.basename(projectDir);

  // ---------- Template select ----------
  let templateId = templateFlag;

  if (templateId) {
    const found = templates.find((t) => t.value === templateId);
    if (!found) {
      p.cancel(`Unknown template "${templateId}". Available: vite-tsx, vite-jsx, levelo-tsx, levelo-jsx`);
      process.exit(1);
    }
  } else {
    templateId = await p.select({
      message: 'Select a template:',
      options: templates.map((t) => ({
        value: t.value,
        label: t.label,
        hint: t.hint,
      })),
    });

    if (p.isCancel(templateId)) {
      p.cancel('Operation cancelled.');
      process.exit(0);
    }
  }

  const template = templates.find((t) => t.value === templateId);
  const templateDir = path.join(__dirname, 'templates', template.folder);

  if (!fs.existsSync(templateDir)) {
    p.cancel(`Error: Template "${templateId}" not found inside CLI package.`);
    process.exit(1);
  }

  if (fs.existsSync(projectDir) && fs.readdirSync(projectDir).length > 0 && targetArg !== '.') {
    p.cancel(`Error: Folder "${targetArg}" already exists and is not empty.`);
    process.exit(1);
  }

  // ---------- Alpha warning ----------
  if (templateId.startsWith('levelo')) {
    p.note(
      'Levelo CLI is in early preview (alpha).\nFor production work, Vite + TypeScript is recommended.',
      'Note'
    );
  }

  const s = ora({
    text: 'Scaffolding Levelo JS project...',
    color: 'magenta',
  }).start();

  try {
    copyFolderSync(templateDir, projectDir);

    const userPackageJsonPath = path.join(projectDir, 'package.json');
    if (fs.existsSync(userPackageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(userPackageJsonPath, 'utf-8'));
      if (targetArg !== '.') pkg.name = projectName;

      // Only for pnpm users: allow esbuild build, keep template clean for npm/bun/yarn
      if (packageManager === 'pnpm') {
        pkg.pnpm = {
          onlyBuiltDependencies: ['esbuild'],
        };
      }

      fs.writeFileSync(userPackageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    }

    // npm strips .gitignore, some templates use _gitignore
    const gitignoreAlt = path.join(projectDir, '_gitignore');
    if (fs.existsSync(gitignoreAlt)) {
      fs.renameSync(gitignoreAlt, path.join(projectDir, '.gitignore'));
    }

    if (!noInstall) {
      s.text = `Installing dependencies via ${packageManager}...`;
      await execPromise(installCmd, { cwd: projectDir });
    } else {
      s.text = `Skipped install (--no-install)`;
    }

    s.succeed('Project created successfully!');

    const nextSteps = targetArg !== '.'
      ? `cd ${targetArg}\n${noInstall ? `${installCmd}\n` : ''}${runCmd}`
      : `${noInstall ? `${installCmd}\n` : ''}${runCmd}`;

    p.note(nextSteps, 'Next steps');
    p.outro(chalk.green(`Happy coding with Levelo JS!`));
  } catch (error) {
    s.fail('Failed to scaffold project.');
    const detailedError = error.stderr || error.stdout || error.message;
    p.cancel(`Execution error:\n${detailedError}`);
    process.exit(1);
  }
}

main();