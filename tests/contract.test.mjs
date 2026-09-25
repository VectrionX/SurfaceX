import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../App.tsx', import.meta.url), 'utf8');
const layout = await readFile(new URL('../components/Layout.tsx', import.meta.url), 'utf8');

test('consent gates collection and discloses domain-scoped egress', () => {
  assert.match(app, /showDisclaimer/);
  assert.match(app, /disabled=\{loading \|\| !domain\.trim\(\) \|\| showDisclaimer\}/);
  assert.match(app, /Collect sends this domain to the selected local or provider-backed snapshot path/);
  assert.match(app, /no monitoring or vulnerability assessment is performed/);
});

test('provider failures surface a user-facing recovery path', () => {
  assert.match(app, /Provider-Assisted mode/);
  assert.match(app, /catch \(err: any\)/);
  assert.match(app, /setError\(err\.message \|\|/);
  assert.match(app, /Switch to Local Mode/);
});

test('navigation has an accessible expanded state and avoids viewport clipping', () => {
  assert.match(layout, /aria-expanded=\{isMobileMenuOpen\}/);
  assert.match(layout, /aria-controls="surface-nav"/);
  assert.match(layout, /firstNavRef\.current\?\.focus\(\)/);
  assert.doesNotMatch(layout, /h-screen overflow-hidden/);
});
