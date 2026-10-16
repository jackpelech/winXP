const RECIPIENT = 'jackpelech@gmail.com';
const SUBJECT = 'jackpelech.com newsletter waitlist signup';
const MAX_BODY_BYTES = 4096;
const WINDOW_MS = 10 * 60 * 1000;

function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}

async function readBody(request) {
  if (!request.body) throw new Error('Missing body');
  const reader = request.body.getReader();
  const chunks = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error('Body too large');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function fingerprint(value) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map(n => n.toString(16).padStart(2, '0'))
    .join('');
}

export function createWorker(
  assets = {},
  { send = fetch, now = Date.now } = {},
) {
  const attempts = new Map();
  async function handleWaitlist(request, env) {
    if (request.method !== 'POST') {
      return json(
        405,
        { ok: false, message: 'Please use the waitlist form.' },
        { Allow: 'POST' },
      );
    }
    if (request.headers.get('Origin') !== new URL(request.url).origin) {
      return json(403, {
        ok: false,
        message: 'Please submit from this website.',
      });
    }
    if (
      !request.headers
        .get('Content-Type')
        ?.toLowerCase()
        .startsWith('application/json')
    ) {
      return json(415, { ok: false, message: 'Please use the waitlist form.' });
    }
    let data;
    try {
      data = await readBody(request);
    } catch {
      return json(400, {
        ok: false,
        message: 'Please check your details and try again.',
      });
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return json(400, {
        ok: false,
        message: 'Please check your details and try again.',
      });
    }
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const email =
      typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    if (
      name.length > 80 ||
      /[\u0000-\u001f\u007f]/.test(name) ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      data.consent !== true ||
      (data.website !== undefined && data.website !== '')
    ) {
      return json(400, {
        ok: false,
        message: 'Please enter a valid email address and try again.',
      });
    }
    if (!env.RESEND_API_KEY || !env.WAITLIST_FROM) {
      return json(503, {
        ok: false,
        message: 'The form is temporarily unavailable. Please try again later.',
      });
    }
    const client =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('oai-authenticated-user-id') ||
      'local';
    const time = now();
    const previous = attempts.get(client);
    const current =
      previous && time - previous.started < WINDOW_MS
        ? previous
        : { started: time, count: 0 };
    if (current.count >= 10) {
      return json(
        429,
        {
          ok: false,
          message: 'Please wait a few minutes before trying again.',
        },
        { 'Retry-After': '600' },
      );
    }
    current.count += 1;
    if (attempts.size >= 2000 && !attempts.has(client))
      attempts.delete(attempts.keys().next().value);
    attempts.set(client, current);
    const day = new Date(time).toISOString().slice(0, 10);
    const key = await fingerprint(JSON.stringify({ name, email, day }));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await send('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `website-waitlist-${key}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          from: env.WAITLIST_FROM,
          to: [RECIPIENT],
          subject: SUBJECT,
          text: [
            'A visitor requested to join the jackpelech.com newsletter waitlist.',
            '',
            `Name: ${name || '(not provided)'}`,
            `Email: ${email}`,
            '',
            'They requested occasional project updates and news about the newsletter launch.',
            'Source: the welcome popup on jackpelech.com.',
          ].join('\n'),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.id) {
        console.error('Waitlist notification rejected', response.status);
        return json(502, {
          ok: false,
          message: 'Your request could not be sent. Please try again shortly.',
        });
      }
      console.info('Waitlist notification accepted', result.id);
      return json(200, { ok: true });
    } catch {
      return json(502, {
        ok: false,
        message: 'Your request could not be sent. Please try again shortly.',
      });
    } finally {
      clearTimeout(timeout);
    }
  }
  return {
    async fetch(request, env = {}) {
      const path = new URL(request.url).pathname;
      if (path === '/api/waitlist') return handleWaitlist(request, env);
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method not allowed', {
          status: 405,
          headers: { Allow: 'GET, HEAD' },
        });
      }
      const asset = assets[path === '/' ? '/index.html' : path];
      if (!asset) return new Response('Not found', { status: 404 });
      const bytes = Uint8Array.from(atob(asset.content), c => c.charCodeAt(0));
      return new Response(request.method === 'HEAD' ? null : bytes, {
        headers: {
          'Content-Type': asset.type,
          'Cache-Control': path.startsWith('/static/')
            ? 'public, max-age=31536000, immutable'
            : 'no-cache',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    },
  };
}

export default createWorker(
  typeof embeddedAssets === 'undefined' ? {} : embeddedAssets,
);
