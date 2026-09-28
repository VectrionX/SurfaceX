import type { ReconReport, Subdomain } from '../types.ts';

const MAX_BODY_BYTES = 1_000_000;
const TIMEOUT_MS = 8_000;
export const PASSIVE_PROVIDER_ORIGINS = Object.freeze(['https://cloudflare-dns.com', 'https://api.certspotter.com']);
const PUBLIC_SUFFIXES = new Set(['com','org','net','edu','gov','io','ai','app','dev','info','biz','cloud','tech','uk','de','fr','ca','us','au','nz','jp','br','cn','sg','za','tr','mx','ar','pl','be','at','eu','co.uk','org.uk','ac.uk','gov.uk','com.au','net.au','org.au','co.jp','co.nz','com.br','com.cn','com.sg','com.tr','com.mx','com.ar']);

export class InvalidDomainError extends Error { constructor() { super('Enter a supported ASCII public registrable domain, such as example.com.'); this.name = 'InvalidDomainError'; } }

/** Pure validation. This ASCII-only conservative parser never resolves or contacts input. */
export const validatePublicDomain = (value: string): string => {
  if (typeof value !== 'string') throw new InvalidDomainError();
  const candidate = value.trim().toLowerCase();
  if (!candidate || candidate.length > 253 || candidate.endsWith('.') || /[\\/@?#\s:[\]]/.test(candidate) || !/^[a-z0-9.-]+$/.test(candidate) || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(candidate)) throw new InvalidDomainError();
  const labels = candidate.split('.');
  if (labels.some((label) => !label || label.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))) throw new InvalidDomainError();
  const suffix = labels.slice(-2).join('.');
  const publicSuffix = PUBLIC_SUFFIXES.has(suffix) ? suffix : labels.at(-1)!;
  if (!PUBLIC_SUFFIXES.has(publicSuffix) || candidate === publicSuffix || labels.length !== publicSuffix.split('.').length + 1) throw new InvalidDomainError();
  return candidate;
};

const providerUrl = (origin: string, path: string, params: Record<string, string>): string => {
  if (!PASSIVE_PROVIDER_ORIGINS.includes(origin)) throw new Error('Provider is outside the allowlist.');
  const url = new URL(path, origin); for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value); return url.toString();
};

const boundedJson = async (url: string, fetchImpl: typeof fetch, controller: AbortController): Promise<unknown> => {
  const request = new URL(url); const expected = request.hostname === 'cloudflare-dns.com' ? 'application/dns-json' : 'application/json';
  const response = await fetchImpl(url, { method: 'GET', headers: { accept: expected }, cache: 'no-store', redirect: 'error', signal: controller.signal });
  const result = response.url ? new URL(response.url) : request;
  if (!response.ok || result.origin !== request.origin || result.pathname !== request.pathname || response.headers.get('content-type')?.split(';')[0] !== expected) throw new Error('Provider response rejected.');
  const declared = Number(response.headers.get('content-length') ?? '0');
  if (!Number.isFinite(declared) || declared > MAX_BODY_BYTES) throw new Error('Provider response rejected.');
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) throw new Error('Provider response rejected.');
  try { return JSON.parse(text); } catch { throw new Error('Provider response rejected.'); }
};

const certificates = (payload: unknown, domain: string): Subdomain[] => {
  if (!Array.isArray(payload)) throw new Error('CT schema rejected.');
  const names = new Set<string>();
  for (const row of payload.slice(0, 100)) {
    if (!row || typeof row !== 'object' || !Array.isArray((row as { dns_names?: unknown }).dns_names)) throw new Error('CT schema rejected.');
    for (const raw of (row as { dns_names: unknown[] }).dns_names) {
      if (typeof raw !== 'string') throw new Error('CT schema rejected.');
      const name = raw.toLowerCase().replace(/^\*\./, '');
      if (/^[a-z0-9.-]+$/.test(name) && (name === domain || name.endsWith(`.${domain}`))) names.add(name);
    }
  }
  return [...names].map((name) => ({ name, ip: 'Not collected', category: 'third-party', ports: [], tags: ['Certificate Transparency observation'], provider: 'Cert Spotter' }));
};

const dnsTxt = (payload: unknown, domain: string): { type: string; value: string }[] => {
  if (!payload || typeof payload !== 'object') throw new Error('DNS schema rejected.');
  const data = payload as { Status?: unknown; Question?: unknown; Answer?: unknown };
  if (data.Status !== 0 || !Array.isArray(data.Question) || data.Question.length !== 1 || (data.Question[0] as { name?: unknown; type?: unknown }).name !== `${domain}.` || (data.Question[0] as { type?: unknown }).type !== 16 || !Array.isArray(data.Answer)) throw new Error('DNS schema rejected.');
  return data.Answer.filter((r): r is { type: number; data: string } => !!r && typeof r === 'object' && (r as { type?: unknown }).type === 16 && typeof (r as { data?: unknown }).data === 'string').map((r) => ({ type: 'TXT', value: r.data.replace(/^"|"$/g, '').trim() }));
};

export const performLocalRecon = async (input: string, fetchImpl: typeof fetch = fetch, consentGranted = false): Promise<ReconReport> => {
  if (!consentGranted) throw new Error('Consent is required before contacting passive providers.');
  const domain = validatePublicDomain(input); const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const cert = providerUrl('https://api.certspotter.com', '/v1/issuances', { domain, include_subdomains: 'true', match_wildcards: 'true', expand: 'dns_names' });
    const dns = providerUrl('https://cloudflare-dns.com', '/dns-query', { name: domain, type: 'TXT' });
    const [ctPayload, dnsPayload] = await Promise.all([boundedJson(cert, fetchImpl, controller), boundedJson(dns, fetchImpl, controller)]);
    const subdomains = certificates(ctPayload, domain); const dnsRecords = dnsTxt(dnsPayload, domain);
    return { domain, timestamp: new Date().toISOString(), overallScore: 0, riskLevel: 'Low', dimensions: { initialAccess: 0, lateralMovement: 0, dataExposure: 0, brandReputation: 0 }, findings: [], subdomains, attackPaths: [], dnsRecords, techStack: ['Certificate Transparency metadata', 'DNS TXT metadata'], securityHeaders: [], summary: `Passive provider observations only: ${subdomains.length} CT name(s) and ${dnsRecords.length} DNS TXT record(s). No target was contacted and no risk score or finding was inferred.` };
  } catch { controller.abort(); throw new Error('Passive providers are unavailable or returned invalid data; no snapshot was produced.'); } finally { clearTimeout(timeout); }
};
