import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'vitest';

const indexHtml = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'index.html'), 'utf8');

test('the local-first interface permits only the approved GA4 tag as an external runtime resource', () => {
  const externalUrls = Array.from(
    indexHtml.matchAll(/<(?:script\b[^>]*src|link\b[^>]*rel="stylesheet"[^>]*href)="(https?:[^\"]+)"/gi),
    ([, url]) => url,
  );

  assert.deepEqual(externalUrls, [
    'https://www.googletagmanager.com/gtag/js?id=G-1EQ8LGX515',
  ]);
  assert.match(indexHtml, /gtag\('config', 'G-1EQ8LGX515'\)/);
  assert.match(indexHtml, /<link rel="stylesheet" href="\/index\.css">/);
});
