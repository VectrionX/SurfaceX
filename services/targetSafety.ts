export type DomainValidationResult =
  | { ok: true; domain: string }
  | { ok: false; reason: string };

const PRIVATE_SUFFIXES = new Set([
  'localhost',
  'local',
  'test',
  'invalid',
  'example',
  'internal',
  'intranet',
  'home',
  'lan',
  'localdomain',
]);

const IPV4_PATTERN = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const DOMAIN_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * Applies client-side guardrails before a public-source query is sent.
 * It is intentionally conservative and does not prove ownership or public routing.
 */
export const validatePublicDomain = (input: string): DomainValidationResult => {
  const raw = input.trim().toLowerCase();
  if (!raw) return { ok: false, reason: 'Enter a domain name.' };
  if (raw.length > 253) return { ok: false, reason: 'The domain name is too long.' };
  if (raw.includes('@') || raw.includes('?') || raw.includes('#')) {
    return { ok: false, reason: 'Enter only a domain name; credentials, queries, and fragments are not allowed.' };
  }

  let candidate = raw;
  if (/^https?:\/\//.test(candidate)) {
    try {
      const url = new URL(candidate);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        return { ok: false, reason: 'Only an optional http or https scheme is accepted.' };
      }
      if (url.port || url.pathname !== '/' || url.search || url.hash) {
        return { ok: false, reason: 'Enter a domain only; paths and ports are not collected.' };
      }
      candidate = url.hostname;
    } catch {
      return { ok: false, reason: 'Enter a valid domain name.' };
    }
  }

  candidate = candidate.replace(/\.$/, '');
  if (IPV4_PATTERN.test(candidate) || candidate.includes(':') || candidate.startsWith('[')) {
    return { ok: false, reason: 'IP addresses are not accepted. Use a public domain name.' };
  }
  if (!candidate.includes('.') || candidate.split('.').some(label => !DOMAIN_LABEL_PATTERN.test(label))) {
    return { ok: false, reason: 'Enter a registrable-looking public domain name.' };
  }

  const labels = candidate.split('.');
  const suffix = labels.at(-1)!;
  if (PRIVATE_SUFFIXES.has(suffix) || PRIVATE_SUFFIXES.has(candidate)) {
    return { ok: false, reason: 'Local, reserved, and private-domain targets are not collected.' };
  }

  return { ok: true, domain: candidate };
};

export const isCandidateHostForDomain = (host: string, domain: string): boolean => {
  const normalized = host.trim().toLowerCase().replace(/^\*\./, '').replace(/\.$/, '');
  if (normalized.length > 253 || !normalized || normalized.split('.').some(label => !DOMAIN_LABEL_PATTERN.test(label))) {
    return false;
  }
  return normalized === domain || normalized.endsWith(`.${domain}`);
};

/** Rejects DNS answers that should never be displayed as public target observations. */
export const isNonPublicAddress = (value: string): boolean => {
  const address = value.trim().toLowerCase();
  if (address === '::' || address === '::1' || address.startsWith('fe80:') || /^(fc|fd)[0-9a-f]{2}:/i.test(address)) {
    return true;
  }
  if (!IPV4_PATTERN.test(address)) return false;

  const octets = address.split('.').map(Number);
  if (octets.some(octet => octet > 255)) return true;
  const [first, second] = octets;
  return first === 0 || first === 10 || first === 127 || first >= 224 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168);
};
