import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const mode = process.argv[2];

if (!['direct', 'server'].includes(mode)) {
  console.error('Usage: node scripts/set-api-mode.mjs <direct|server>');
  process.exit(1);
}

const envPath = resolve(process.cwd(), '.env.local');
const key = 'NEXT_PUBLIC_STUDMANAGER_API_MODE';
const line = `${key}=${mode}`;
const current = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
const lines = current
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((item) => !item.startsWith(`${key}=`));

lines.push(line);
writeFileSync(envPath, `${lines.join('\n')}\n`);

console.log(`API transport mode set to "${mode}" in .env.local`);
