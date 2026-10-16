import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createWorker } from './index.mjs';

const origin = 'https://portfolio.example';
const env = {
  RESEND_API_KEY: 'test-key',
  WAITLIST_FROM: 'Website <waitlist@example.com>',
};
function submission(
  body = { email: 'visitor@example.com', consent: true },
  headers = {},
) {
  return new Request(`${origin}/api/waitlist`, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}
function setup() {
  const deliveries = [];
  const worker = createWorker(
    {},
    {
      now: () => Date.UTC(2026, 9, 16),
      send: async (url, options) => {
        deliveries.push({
          url,
          headers: options.headers,
          data: JSON.parse(options.body),
        });
        return Response.json({ id: 'test-message-id' });
      },
    },
  );
  return { worker, deliveries };
}

test('a visitor submission emails only the site owner with a fixed subject and normalized details', async () => {
  const { worker, deliveries } = setup();
  const response = await worker.fetch(
    submission({
      name: '  A Visitor  ',
      email: ' VISITOR@example.com ',
      consent: true,
      to: 'unwanted@example.com',
      subject: 'Untrusted subject',
    }),
    env,
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(deliveries.length, 1);
  assert.equal(deliveries[0].url, 'https://api.resend.com/emails');
  assert.deepEqual(deliveries[0].data.to, ['jackpelech@gmail.com']);
  assert.equal(
    deliveries[0].data.subject,
    'jackpelech.com newsletter waitlist signup',
  );
  assert.match(deliveries[0].data.text, /Email: visitor@example.com/);
  assert.doesNotMatch(deliveries[0].data.text, /Name:|A Visitor/);
  assert.equal(deliveries[0].data.from, env.WAITLIST_FROM);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
});

test('email-only submissions reuse an idempotency key', async () => {
  const { worker, deliveries } = setup();
  for (let i = 0; i < 2; i++) {
    const response = await worker.fetch(
      submission({ email: 'visitor@example.com', consent: true }),
      env,
    );
    assert.equal(response.status, 200);
  }
  assert.doesNotMatch(deliveries[0].data.text, /Name:/);
  assert.equal(
    deliveries[0].headers['Idempotency-Key'],
    deliveries[1].headers['Idempotency-Key'],
  );
});

test('invalid addresses, oversized submissions, spam fields, and missing consent never trigger email', async () => {
  const { worker, deliveries } = setup();
  for (const body of [
    { email: 'bad-address', consent: true },
    { email: 'visitor@example.com', consent: false },
    { email: 'visitor@example.com', consent: true, website: 'spam' },
    {
      email: 'visitor@example.com\r\nBcc: unwanted@example.com',
      consent: true,
    },
    { email: `${'a'.repeat(250)}@example.com`, consent: true },
    'invalid JSON',
    JSON.stringify({ email: 'visitor@example.com', extra: 'a'.repeat(5000) }),
  ])
    assert.equal((await worker.fetch(submission(body), env)).status, 400);
  assert.equal(deliveries.length, 0);
});

test('cross-origin requests and GET requests cannot send notifications', async () => {
  const { worker, deliveries } = setup();
  assert.equal(
    (
      await worker.fetch(
        submission(undefined, { Origin: 'https://elsewhere.example' }),
        env,
      )
    ).status,
    403,
  );
  assert.equal(
    (await worker.fetch(submission(undefined, { Origin: '' }), env)).status,
    403,
  );
  assert.equal(
    (await worker.fetch(new Request(`${origin}/api/waitlist`), env)).status,
    405,
  );
  assert.equal(deliveries.length, 0);
});

test('provider rejection and missing credentials never produce a false success', async () => {
  const rejected = createWorker(
    {},
    {
      send: async () => Response.json({ message: 'Rejected' }, { status: 403 }),
    },
  );
  assert.equal((await rejected.fetch(submission(), env)).status, 502);
  const malformed = createWorker({}, { send: async () => Response.json({}) });
  assert.equal((await malformed.fetch(submission(), env)).status, 502);
  const { worker, deliveries } = setup();
  assert.equal((await worker.fetch(submission(), {})).status, 503);
  assert.equal(deliveries.length, 0);
});

test('repeated requests from one client are limited', async () => {
  const { worker, deliveries } = setup();
  for (let i = 0; i < 10; i++)
    assert.equal((await worker.fetch(submission(), env)).status, 200);
  const response = await worker.fetch(submission(), env);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '600');
  assert.equal(deliveries.length, 10);
});

test('the Worker serves only its bundled public assets and preserves binary bytes', async () => {
  const worker = createWorker({
    '/index.html': {
      type: 'text/html',
      content: Buffer.from('<main>XP</main>').toString('base64'),
    },
    '/static/icon.png': {
      type: 'image/png',
      content: Buffer.from([0, 127, 255]).toString('base64'),
    },
  });
  assert.equal(
    await (await worker.fetch(new Request(origin))).text(),
    '<main>XP</main>',
  );
  const icon = await worker.fetch(new Request(`${origin}/static/icon.png`));
  assert.deepEqual(
    new Uint8Array(await icon.arrayBuffer()),
    new Uint8Array([0, 127, 255]),
  );
  assert.match(icon.headers.get('Cache-Control'), /immutable/);
  assert.equal((await worker.fetch(new Request(`${origin}/.env`))).status, 404);
  assert.equal(
    await (await worker.fetch(new Request(origin, { method: 'HEAD' }))).text(),
    '',
  );
});
