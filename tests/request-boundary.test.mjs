import test from 'node:test';
import assert from 'node:assert/strict';
import { performLocalRecon, validatePublicDomain } from '../services/reconService.ts';

const response = (body, ok = true) => ({ ok, status: ok ? 200 : 503, json: async () => body });

test('validation rejects URLs, credentials, paths, IPs, and private names before egress', async () => {
  for (const value of ['https://acme.com', 'acme.com/path', 'user:pass@acme.com', '127.0.0.1', 'localhost', 'example.internal', 'example']) {
    assert.throws(() => validatePublicDomain(value));
  }
  assert.equal(validatePublicDomain('Acme.COM'), 'acme.com');
});

test('request boundary only contacts passive providers after consent-controlled call', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (url.startsWith('https://crt.sh/')) return response([{ name_value: 'acme.com\nwww.acme.com' }]);
    if (url.startsWith('https://cloudflare-dns.com/')) return response({ Answer: [{ data: 'v=spf1 -all' }] });
    throw new Error(`unexpected egress: ${url}`);
  };
  const report = await performLocalRecon('acme.com', fetchImpl);
  assert.equal(report.domain, 'acme.com');
  assert.equal(calls.length, 2);
  assert.ok(calls.every(({ url, options }) => ['https://crt.sh', 'https://cloudflare-dns.com'].some(origin => url.startsWith(origin)) && options.method === 'GET'));
  assert.ok(calls.every(({ url }) => !url.includes('acme.com/') || url.startsWith('https://crt.sh/') || url.startsWith('https://cloudflare-dns.com/')));
});

test('provider failure fails closed and never contacts the target', async () => {
  const calls = [];
  await assert.rejects(() => performLocalRecon('acme.com', async (url) => {
    calls.push(url);
    return response({}, false);
  }), /Passive providers are unavailable/);
  assert.equal(calls.length, 2);
  assert.ok(calls.every(url => url.startsWith('https://crt.sh/') || url.startsWith('https://cloudflare-dns.com/')));
});
