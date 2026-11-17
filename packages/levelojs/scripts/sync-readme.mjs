import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const rootReadme = resolve(here, '../../../README.md');
const packageReadme = resolve(here, '../README.md');

writeFileSync(packageReadme, readFileSync(rootReadme));
console.log('Synced package README from project root.');
