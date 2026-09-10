import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');

const meta = (property: string) => html.match(new RegExp(`<meta\\s+property="${property}"\\s+content="([^"]+)"`, 'i'))?.[1];

describe('SurfaceX static indexability metadata', () => {
  it('publishes truthful canonical and social metadata', () => {
    expect(html).toContain('<title>SurfaceX | Passive Evidence Snapshot</title>');
    expect(html).toContain('name="description" content="A bounded analyst snapshot for provenance-preserving public-source observations. No direct target traffic, scanning, risk scores, or generated findings."');
    expect(html).toContain('<link rel="canonical" href="https://surfacex.vectrionx.com/">');
    expect(meta('og:title')).toBe('SurfaceX | Passive Evidence Snapshot');
    expect(meta('og:url')).toBe('https://surfacex.vectrionx.com/');
  });

  it('publishes a minimal accurate application schema', () => {
    expect(html).toContain('"@type":["WebApplication","Product"]');
    expect(html).toContain('"url":"https://surfacex.vectrionx.com/"');
  });

  it('provides an allowed-root sitemap', () => {
    expect(readFileSync(resolve(root, 'public/sitemap.xml'), 'utf8')).toContain('<loc>https://surfacex.vectrionx.com/</loc>');
    expect(readFileSync(resolve(root, 'public/robots.txt'), 'utf8')).toContain('Allow: /');
  });
});
