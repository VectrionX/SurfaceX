import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../App.tsx', import.meta.url), 'utf8');
const layout = await readFile(new URL('../components/Layout.tsx', import.meta.url), 'utf8');

test('consent gates collection and discloses domain-scoped egress', () => {
  assert.match(app, /showDisclaimer/);
  assert.match(app, /const \[consentGranted, setConsentGranted\] = useState\(false\)/);
  assert.match(app, /disabled=\{loading \|\| !domain\.trim\(\) \|\| !consentGranted\}/);
  assert.match(app, /setConsentGranted\(true\)/);
  assert.match(app, /Collect sends this validated public domain to Cloudflare DNS-over-HTTPS and SSLMate\/Cert Spotter/);
  assert.match(app, /no monitoring or vulnerability assessment is performed/i);
});

test('passive provider failures fail closed with a user-facing recovery path', () => {
  assert.doesNotMatch(app, /apiKey|GoogleGenAI|gemini/);
  assert.match(app, /catch \(err: any\)/);
  assert.match(app, /setError\(err\.message \|\|/);
  assert.match(app, /Dismiss/);
});

test('the snapshot has no target contact or fabricated evidence paths', async () => {
  const recon = await readFile(new URL('../services/reconService.ts', import.meta.url), 'utf8');
  assert.match(recon, /validatePublicDomain/);
  assert.match(recon, /PASSIVE_PROVIDER_ORIGINS/);
  assert.match(recon, /api\.certspotter\.com/);
  assert.match(recon, /cloudflare-dns\.com/);
  assert.doesNotMatch(recon, /probePort|RESTRICTED_PORTS|https:\/\/\$\{host\}/);
  assert.doesNotMatch(recon, /Successful HTTP|mimic real|realistic findings/);
});

test('navigation has an accessible expanded state and avoids viewport clipping', () => {
  assert.match(layout, /aria-expanded=\{isMobileMenuOpen\}/);
  assert.match(layout, /aria-controls="surface-nav"/);
  assert.match(layout, /firstNavRef\.current\?\.focus\(\)/);
  assert.doesNotMatch(layout, /h-screen overflow-hidden/);
});
