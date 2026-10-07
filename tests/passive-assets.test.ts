import { describe, expect, it, vi } from 'vitest';
import { collectPassiveSnapshot } from '../services/reconService';

const response = (body: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => body,
}) as Response;

describe('passive DNS asset observations', () => {
  it('resolves in-scope certificate names through the declared DNS provider without contacting hosts', async () => {
    const fetcher = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('crt.sh')) return response([{ name_value: 'api.example.com\nadmin.example.com\nevil-example.com' }]);
      if (url.includes('type=TXT')) return response({ Answer: [{ type: 16, data: '"v=spf1 -all"' }] });
      if (url.includes('api.example.com')) return response({ Answer: [
        { type: 1, data: '203.0.113.10' },
        { type: 1, data: '10.0.0.4' },
      ] });
      return response({ Answer: [{ type: 1, data: '198.51.100.20' }] });
    });

    const snapshot = await collectPassiveSnapshot('example.com', fetcher);

    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      'https://crt.sh/?q=example.com&output=json',
      'https://cloudflare-dns.com/dns-query?name=example.com&type=TXT',
      'https://cloudflare-dns.com/dns-query?name=admin.example.com&type=A',
      'https://cloudflare-dns.com/dns-query?name=api.example.com&type=A',
    ]);
    expect(snapshot.assetObservations.sort((a, b) => a.hostname.localeCompare(b.hostname))).toEqual([
      expect.objectContaining({
        hostname: 'admin.example.com',
        status: 'success',
        addresses: ['198.51.100.20'],
      }),
      expect.objectContaining({
        hostname: 'api.example.com',
        status: 'success',
        addresses: ['203.0.113.10'],
      }),
    ]);
  });
});
