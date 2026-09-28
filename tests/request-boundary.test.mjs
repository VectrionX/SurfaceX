import test from 'node:test';
import assert from 'node:assert/strict';
import { performLocalRecon, validatePublicDomain } from '../services/reconService.ts';

const response = (body, { ok = true, type = 'application/json', url = '', length } = {}) => ({ ok, status: ok ? 200 : 503, url, headers: new Headers({ 'content-type': type, ...(length ? { 'content-length': String(length) } : {}) }), text: async () => JSON.stringify(body) });
const validDns = { Status: 0, Question: [{ name: 'acme.com.', type: 16 }], Answer: [{ type: 16, data: '"v=spf1 -all"' }] };
const invalid = ['https://acme.com','acme.com/path','acme.com?x=1','user:pass@acme.com','acme.com:443','127.0.0.1','::1','localhost','example.internal','example','foo.invalid','co.uk','foo..com','-foo.com','foo-.com','foo .com','service.acme.com'];

test('invalid names reject with zero egress and accepted input is exact registrable domain', async () => {
  for (const input of invalid) assert.throws(() => validatePublicDomain(input), input);
  assert.equal(validatePublicDomain('Acme.COM'), 'acme.com');
  let calls = 0; await assert.rejects(() => performLocalRecon('127.0.0.1', async () => { calls++; }, true), /registrable/); assert.equal(calls, 0);
});

test('consent is the first request boundary', async () => {
  let calls = 0; await assert.rejects(() => performLocalRecon('not a domain', async () => { calls++; }), /Consent is required/); assert.equal(calls, 0);
});

test('egress uses only exact providers and never target authority', async () => {
  const calls = []; const fetch = async (url, init) => { calls.push({ url, init }); const parsed = new URL(url); assert.ok(['cloudflare-dns.com','api.certspotter.com'].includes(parsed.hostname)); assert.notEqual(parsed.hostname, 'acme.com'); return parsed.hostname === 'api.certspotter.com' ? response([{ dns_names: ['acme.com','www.acme.com'] }]) : response(validDns, { type: 'application/dns-json' }); };
  const report = await performLocalRecon('acme.com', fetch, true); assert.equal(report.findings.length, 0); assert.equal(report.subdomains[0].provider, 'Cert Spotter'); assert.equal(calls.length, 2); assert.ok(calls.every(({ init }) => init.method === 'GET' && init.redirect === 'error'));
});

test('failure, malformed schemas, redirects, media type and bounded body reject without partial report', async () => {
  const reject = async (producer) => assert.rejects(() => performLocalRecon('acme.com', producer, true), /no snapshot/);
  await reject(async () => response({}, { ok: false }));
  await reject(async () => response([], { url: 'https://evil.example/redirect' }));
  await reject(async () => response([], { type: 'text/html' }));
  await reject(async () => response([], { length: 1000001 }));
  await reject(async (url) => new URL(url).hostname === 'api.certspotter.com' ? response([{ dns_names: 'acme.com' }]) : response(validDns, { type: 'application/dns-json' }));
  await reject(async (url) => new URL(url).hostname === 'api.certspotter.com' ? response([]) : response({ Status: 3, Question: [], Answer: [] }, { type: 'application/dns-json' }));
});
