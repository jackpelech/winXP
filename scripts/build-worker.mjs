import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { extname, join } from 'node:path';

const require = createRequire(import.meta.url);
execFileSync(
  process.execPath,
  [require.resolve('react-scripts/scripts/build.js')],
  {
    stdio: 'inherit',
    env: { ...process.env, GENERATE_SOURCEMAP: 'false' },
  },
);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
};
const assets = {};
function collect(directory, prefix = '') {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, item.name);
    const key = `${prefix}/${item.name}`;
    if (item.isDirectory()) collect(path, key);
    else if (!item.name.endsWith('.map')) {
      assets[key] = {
        type: types[extname(item.name)] || 'application/octet-stream',
        content: readFileSync(path).toString('base64'),
      };
    }
  }
}
collect('build');
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist/server', { recursive: true });
mkdirSync('dist/.openai', { recursive: true });
writeFileSync(
  'dist/server/index.js',
  `const embeddedAssets = ${JSON.stringify(assets)};\n${readFileSync(
    'worker/index.mjs',
    'utf8',
  )}`,
);
if (existsSync('.openai/hosting.json')) {
  cpSync('.openai/hosting.json', 'dist/.openai/hosting.json');
} else {
  writeFileSync(
    'dist/.openai/hosting.json',
    JSON.stringify({ d1: null, r2: null }),
  );
}
console.log(
  `Built the XP desktop and email endpoint with ${
    Object.keys(assets).length
  } embedded assets.`,
);
