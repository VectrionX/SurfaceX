import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'vitest';

const indexHtml = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'index.html'), 'utf8');

test('the local-first interface does not load runtime scripts or styles from third parties', () => {
  assert.doesNotMatch(indexHtml, /<(?:script|link)[^>]+https?:\/\//i);
  assert.match(indexHtml, /<link rel="stylesheet" href="\/index\.css">/);
});
