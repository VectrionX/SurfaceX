import type { ReconReport, ReconFinding, Subdomain, RiskDimensions } from '../types.ts';
const RiskLevel = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical' } as const;
const ConfidenceLevel = { HIGH: 'High' } as const;

export const PASSIVE_PROVIDER_ORIGINS = Object.freeze([
  'https://crt.sh',
  'https://cloudflare-dns.com',
]);

const MULTI_LABEL_PUBLIC_SUFFIXES = new Set(['co.uk', 'org.uk', 'com.au', 'net.au', 'co.jp', 'co.nz']);
const PRIVATE_LABELS = new Set(['localhost', 'local', 'internal', 'intranet', 'home', 'lan', 'corp', 'test', 'invalid', 'example']);

export class InvalidDomainError extends Error {
  constructor(message = 'Enter a public registrable domain, such as example.com.') {
    super(message);
    this.name = 'InvalidDomainError';
  }
}

/** Validate before any provider request. This function intentionally does not resolve or contact the target. */
export const validatePublicDomain = (value: string): string => {
  const candidate = value.trim().toLowerCase();
  if (!candidate || candidate.length > 253 || /[\\/@?#\s]/.test(candidate) || candidate.includes(':') || candidate.includes('\\')) {
    throw new InvalidDomainError();
  }
  if (/^https?:/i.test(candidate) || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(candidate) || candidate.includes('[')) {
    throw new InvalidDomainError();
  }
  const labels = candidate.split('.');
  if (labels.length < 2 || labels.some(label => !label || label.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))) {
    throw new InvalidDomainError();
  }
  if (labels.some(label => PRIVATE_LABELS.has(label))) throw new InvalidDomainError();
  const suffix = labels.slice(-2).join('.');
  const registrableParts = MULTI_LABEL_PUBLIC_SUFFIXES.has(suffix) ? 3 : 2;
  if (labels.length < registrableParts) throw new InvalidDomainError();
  const tld = labels.at(-1)!;
  if (!/^[a-z]{2,63}$/.test(tld) || tld.startsWith('xn--') && tld.length < 7) throw new InvalidDomainError();
  return candidate;
};

const providerUrl = (origin: string, path: string): string => {
  if (!PASSIVE_PROVIDER_ORIGINS.includes(origin)) throw new Error('Provider is outside the passive allowlist.');
  return `${origin}${path}`;
};

const fetchJson = async (url: string, fetchImpl: typeof fetch): Promise<any> => {
  const response = await fetchImpl(url, { method: 'GET', headers: { accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error(`Passive provider returned HTTP ${response.status}.`);
  return response.json();
};

const cleanValue = (value: string) => value.replace(/^"|"$/g, '').trim();

export const performLocalRecon = async (input: string, fetchImpl: typeof fetch = fetch): Promise<ReconReport> => {
  const domain = validatePublicDomain(input);
  const findings: ReconFinding[] = [];
  const subdomains: Subdomain[] = [];
  const techStack = new Set<string>(['DNS metadata', 'Certificate Transparency']);
  const dimensions: RiskDimensions = { initialAccess: 0, lateralMovement: 0, dataExposure: 0, brandReputation: 0 };

  // Every request below is to an allow-listed passive provider. The target is never fetched, resolved, or probed.
  const certUrl = providerUrl('https://crt.sh', `/?q=${encodeURIComponent(`%.${domain}`)}&output=json`);
  const dnsUrl = (type: string) => providerUrl('https://cloudflare-dns.com', `/dns-query?name=${encodeURIComponent(domain)}&type=${type}`);
  let certificates: any[];
  let txtData: any;
  try {
    [certificates, txtData] = await Promise.all([
      fetchJson(certUrl, fetchImpl),
      fetchJson(dnsUrl('TXT'), fetchImpl),
    ]);
  } catch {
    throw new Error('Passive providers are unavailable; no snapshot was produced.');
  }

  const discoveredNames = new Set<string>([domain]);
  for (const certificate of Array.isArray(certificates) ? certificates.slice(0, 100) : []) {
    for (const rawName of String(certificate?.name_value ?? '').split(/\s+/)) {
      const name = rawName.toLowerCase().replace(/^\*\./, '');
      if (name === domain || name.endsWith(`.${domain}`)) discoveredNames.add(name);
    }
  }
  for (const name of discoveredNames) {
    subdomains.push({ name, ip: 'not collected', category: name.includes('api') ? 'cloud' : 'saas', ports: [], tags: ['Passive CT metadata'], provider: 'crt.sh' });
  }

  const txtRecords: string[] = Array.isArray(txtData?.Answer) ? txtData.Answer.map((answer: any) => cleanValue(String(answer?.data ?? ''))) : [];
  if (!txtRecords.some(value => value.toLowerCase().startsWith('v=spf1'))) {
    findings.push({ id: 'L-EMAIL-SPF', module: 'Email Security', category: 'exposure', title: 'Missing SPF Record', description: 'No SPF record was observed in the passive DNS response.', severity: RiskLevel.HIGH as ReconFinding['severity'], confidence: ConfidenceLevel.HIGH as ReconFinding['confidence'], affectedAsset: domain, evidence: 'Passive DNS TXT response contained no v=spf1 record.', impact: 'Increased spoofing risk.', recommendation: 'Review and publish an SPF policy appropriate for authorized mail senders.', threatActorContext: 'A bounded defensive observation; no exploit or delivery test was performed.', compliance: [{ framework: 'CIS', control: '9.2', description: 'Anti-Phishing' }] });
    dimensions.brandReputation = 30;
  }
  if (subdomains.length > 5) dimensions.lateralMovement = 20;
  else if (subdomains.length > 0) dimensions.lateralMovement = 10;
  const overallScore = findings.length ? Math.round((dimensions.initialAccess + dimensions.brandReputation + dimensions.dataExposure + dimensions.lateralMovement) / 4) : 0;
  return { domain, timestamp: new Date().toISOString(), overallScore, riskLevel: (overallScore >= 70 ? RiskLevel.CRITICAL : overallScore >= 40 ? RiskLevel.HIGH : overallScore >= 15 ? RiskLevel.MEDIUM : RiskLevel.LOW) as ReconReport['riskLevel'], dimensions, findings, subdomains, attackPaths: [], dnsRecords: txtRecords.map(value => ({ type: 'TXT', value })), techStack: Array.from(techStack), securityHeaders: [], summary: findings.length ? `Passive providers returned ${findings.length} bounded observation(s) across ${subdomains.length} certificate names.` : 'No bounded observations met the reporting threshold in the passive snapshot.' };
};
