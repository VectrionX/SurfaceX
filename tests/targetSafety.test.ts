import { describe, expect, it, vi } from 'vitest';
import { collectPassiveSnapshot, TargetValidationError } from '../services/reconService';
import { validatePublicDomain } from '../services/targetSafety';

const response = (body: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => body,
}) as Response;

describe('validatePublicDomain', () => {
  it('normalizes a public domain with an optional https scheme', () => {
    expect(validatePublicDomain('https://Example.COM/')).toEqual({ ok: true, domain: 'example.com' });
  });

  it('rejects address literals and private-domain targets', () => {
    expect(validatePublicDomain('192.168.1.1').ok).toBe(false);
    expect(validatePublicDomain('localhost').ok).toBe(false);
    expect(validatePublicDomain('service.internal').ok).toBe(false);
    expect(validatePublicDomain('api.example.local').ok).toBe(false);
  });
});

describe('collectPassiveSnapshot', () => {
  it('rejects an unsafe target before any egress occurs', async () => {
    const fetcher = vi.fn();
    await expect(collectPassiveSnapshot('127.0.0.1', fetcher)).rejects.toBeInstanceOf(TargetValidationError);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('keeps only in-scope provider records and records passive provenance', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response([{ name_value: '*.api.example.com\nexample.com\nevil-example.com' }]))
      .mockResolvedValueOnce(response({ Answer: [{ type: 16, data: '"v=spf1 -all"' }] }))
      .mockResolvedValueOnce(response({ Answer: [{ type: 1, data: '203.0.113.10' }] }));

    const snapshot = await collectPassiveSnapshot('example.com', fetcher);

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      'https://crt.sh/?q=example.com&output=json',
      'https://cloudflare-dns.com/dns-query?name=example.com&type=TXT',
      'https://cloudflare-dns.com/dns-query?name=api.example.com&type=A',
    ]);
    expect(snapshot.contract.directTargetConnections).toBe(false);
    expect(snapshot.contract.activeProbing).toBe(false);
    expect(snapshot.observations[0]).toMatchObject({
      sourceId: 'crt.sh',
      classification: 'passive',
      status: 'success',
      records: [
        { kind: 'certificate-name', value: '*.api.example.com' },
        { kind: 'certificate-name', value: 'example.com' },
      ],
    });
    expect(snapshot.observations[1].records).toEqual([{ kind: 'dns-txt', value: 'v=spf1 -all' }]);
  });

  it('reports provider failures as errors without manufacturing observations', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response({}, false, 503))
      .mockRejectedValueOnce(new Error('network unavailable'));

    const snapshot = await collectPassiveSnapshot('example.com', fetcher);

    expect(snapshot.observations.map(observation => observation.status)).toEqual(['error', 'error']);
    expect(snapshot.observations.flatMap(observation => observation.records)).toEqual([]);
    expect(snapshot.errors).toHaveLength(2);
    expect(snapshot.errors.map(error => error.message)).toEqual([
      'Source returned HTTP 503.',
      'Request or response parsing failed.',
    ]);
  });

  it('bounds provider-controlled evidence before retaining it in the report', async () => {
    const oversizedName = `${'a'.repeat(254)}.example.com`;
    const oversizedTxt = '"' + 'x'.repeat(4097) + '"';
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response([{ name_value: `${oversizedName}\napi.example.com` }]))
      .mockResolvedValueOnce(response({ Answer: [{ type: 16, data: oversizedTxt }] }));

    const snapshot = await collectPassiveSnapshot('example.com', fetcher);

    expect(snapshot.observations[0].records).toEqual([
      { kind: 'certificate-name', value: 'api.example.com' },
    ]);
    expect(snapshot.observations[1].records).toEqual([]);
  });
});
