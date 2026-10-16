import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorker } from './index.mjs';

const worker = createWorker({
  '/index.html': { type: 'text/html', content: btoa('Desktop') },
  '/frames/index.html': { type: 'text/html', content: btoa('Frames') },
  '/paint/index.html': { type: 'text/html', content: btoa('Paint') },
  '/paint/src/app.js': {
    type: 'application/javascript',
    content: btoa('patched input'),
  },
});

test('serves the local Paint input while pinning unchanged assets to one upstream version', async () => {
  for (const [path, content] of [
    ['/paint/', 'Paint'],
    ['/paint/src/app.js', 'patched input'],
  ]) {
    const response = await worker.fetch(
      new Request(`https://portfolio.test${path}`),
    );
    assert.equal(response.status, 200);
    assert.equal(await response.text(), content);
  }
  const asset = await worker.fetch(
    new Request('https://portfolio.test/paint/images/tools.png'),
  );
  assert.equal(asset.status, 302);
  assert.equal(
    asset.headers.get('Location'),
    'https://cdn.jsdelivr.net/gh/1j01/jspaint@53be67ab8c47cc0d2168899e7481bc04839c4c81/images/tools.png',
  );
  const missingCode = await worker.fetch(
    new Request('https://portfolio.test/paint/src/missing.js'),
  );
  assert.equal(missingCode.status, 404);
});

test('serves the desktop and the Frames page at their public addresses', async () => {
  for (const [path, content] of [
    ['/', 'Desktop'],
    ['/frames', 'Frames'],
    ['/frames/', 'Frames'],
    ['/frames/index.html', 'Frames'],
  ]) {
    const response = await worker.fetch(
      new Request(`https://portfolio.test${path}`),
    );
    assert.equal(response.status, 200, path);
    assert.equal(await response.text(), content, path);
    assert.equal(response.headers.get('Content-Type'), 'text/html');
  }
});

test('unknown pages remain missing and HEAD responses have no body', async () => {
  const missing = await worker.fetch(
    new Request('https://portfolio.test/missing/'),
  );
  assert.equal(missing.status, 404);
  const head = await worker.fetch(
    new Request('https://portfolio.test/frames/', { method: 'HEAD' }),
  );
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});
