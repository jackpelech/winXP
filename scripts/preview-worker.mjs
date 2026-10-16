import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const source = await readFile('dist/server/index.js', 'utf8');
const { default: worker } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);
const env = {};
if (process.stdin.isTTY) process.stdin.setRawMode(true);
console.log(
  'Ready for local email environment JSON on stdin (input is hidden).',
);
await new Promise((resolve, reject) => {
  let buffer = '';
  process.stdin.on('data', chunk => {
    buffer += chunk.toString();
    if (!buffer.includes('\n')) return;
    try {
      Object.assign(env, JSON.parse(buffer.trim()));
      resolve();
    } catch {
      reject(new Error('Invalid local preview configuration'));
    }
    process.stdin.pause();
    if (process.stdin.isTTY) process.stdin.setRawMode(false);
  });
});
createServer(async (req, res) => {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const request = new Request(`http://127.0.0.1:5173${req.url}`, {
      method: req.method,
      headers: req.headers,
      ...(req.method !== 'GET' && req.method !== 'HEAD'
        ? { body: Buffer.concat(chunks) }
        : {}),
    });
    const response = await worker.fetch(request, env);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.writeHead(500);
    res.end('Local preview error');
  }
}).listen(5173, '127.0.0.1', () =>
  console.log('Local: http://127.0.0.1:5173/'),
);
