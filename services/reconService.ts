import {
  CollectionError,
  CollectionSafetyContract,
  SnapshotReport,
  SourceObservation,
  PassiveAssetObservation,
} from '../types';
import { isCandidateHostForDomain, isNonPublicAddress, validatePublicDomain } from './targetSafety';

export const COLLECTION_SAFETY_CONTRACT: CollectionSafetyContract = {
  mode: 'passive-only',
  authorizationRequired: true,
  directTargetConnections: false,
  activeProbing: false,
  credentialsAccepted: false,
  retention: 'browser-memory-only',
  egressDestinations: ['https://crt.sh', 'https://cloudflare-dns.com'],
  excludedTargets: [
    'IP address literals',
    'localhost and reserved names',
    'private and internal-looking domains',
    'paths, ports, credentials, queries, and fragments',
  ],
};

export class TargetValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TargetValidationError';
  }
}

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

const now = () => new Date().toISOString();
const MAX_TEXT_RECORD_LENGTH = 4096;

const responseError = (response: Response) => `Source returned HTTP ${response.status}.`;
const malformedResponse = 'Provider returned an unrecognized payload.';

const collectCertificateNames = async (domain: string, fetcher: Fetcher): Promise<SourceObservation> => {
  const sourceUrl = `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`;
  const queriedAt = now();
  const base = {
    sourceId: 'crt.sh' as const,
    sourceName: 'crt.sh Certificate Transparency search',
    sourceUrl,
    classification: 'passive' as const,
    egressDisclosure: 'The target domain is sent to crt.sh. SurfaceX does not connect to the target.',
    queriedAt,
  };

  try {
    const response = await fetcher(sourceUrl, { headers: { accept: 'application/json' } });
    if (!response.ok) return { ...base, status: 'error', records: [], note: responseError(response) };

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) return { ...base, status: 'error', records: [], note: malformedResponse };
    const names = payload.flatMap(item => typeof item === 'object' && item !== null && 'name_value' in item && typeof item.name_value === 'string'
      ? item.name_value.split(/\r?\n/)
      : []);
    const records = [...new Set(names
      .map(name => name.trim().toLowerCase())
      .filter(name => isCandidateHostForDomain(name, domain)))]
      .sort()
      .map(value => ({ kind: 'certificate-name' as const, value }));

    return {
      ...base,
      status: records.length ? 'success' : 'empty',
      records,
      note: records.length ? 'Names were present in the provider response.' : 'The provider returned no in-scope certificate names.',
    };
  } catch {
    return { ...base, status: 'error', records: [], note: 'Request or response parsing failed.' };
  }
};

const collectTxtRecords = async (domain: string, fetcher: Fetcher): Promise<SourceObservation> => {
  const sourceUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=TXT`;
  const queriedAt = now();
  const base = {
    sourceId: 'cloudflare-doh' as const,
    sourceName: 'Cloudflare DNS-over-HTTPS',
    sourceUrl,
    classification: 'passive' as const,
    egressDisclosure: 'The target domain is sent to Cloudflare DNS-over-HTTPS. SurfaceX does not connect to the target.',
    queriedAt,
  };

  try {
    const response = await fetcher(sourceUrl, { headers: { accept: 'application/dns-json' } });
    if (!response.ok) return { ...base, status: 'error', records: [], note: responseError(response) };

    const payload: unknown = await response.json();
    const answers = typeof payload === 'object' && payload !== null && 'Answer' in payload && Array.isArray(payload.Answer)
      ? payload.Answer
      : null;
    if (answers === null) return { ...base, status: 'error', records: [], note: malformedResponse };
    const records = answers.flatMap(answer =>
      typeof answer === 'object' && answer !== null && 'type' in answer && 'data' in answer && answer.type === 16 && typeof answer.data === 'string'
        ? (() => {
          const value = answer.data.replace(/^"|"$/g, '');
          return value.length <= MAX_TEXT_RECORD_LENGTH ? [{ kind: 'dns-txt' as const, value }] : [];
        })()
        : []
    );

    return {
      ...base,
      status: records.length ? 'success' : 'empty',
      records,
      note: records.length ? 'TXT records were present in the provider response.' : 'The provider returned no TXT records.',
    };
  } catch {
    return { ...base, status: 'error', records: [], note: 'Request or response parsing failed.' };
  }
};

const MAX_ASSET_NAMES = 25;

const collectAssetObservation = async (hostname: string, fetcher: Fetcher): Promise<PassiveAssetObservation> => {
  const sourceUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`;
  const queriedAt = now();
  try {
    const response = await fetcher(sourceUrl, { headers: { accept: 'application/dns-json' } });
    if (!response.ok) return { hostname, sourceUrl, queriedAt, status: 'error', addresses: [], note: responseError(response) };
    const payload: unknown = await response.json();
    const answers = typeof payload === 'object' && payload !== null && 'Answer' in payload && Array.isArray(payload.Answer)
      ? payload.Answer
      : null;
    if (answers === null) return { hostname, sourceUrl, queriedAt, status: 'error', addresses: [], note: malformedResponse };
    const addresses = [...new Set(answers.flatMap(answer =>
      typeof answer === 'object' && answer !== null && 'type' in answer && 'data' in answer && answer.type === 1 && typeof answer.data === 'string' && !isNonPublicAddress(answer.data)
        ? [answer.data.trim()]
        : []
    ))];
    return {
      hostname,
      sourceUrl,
      queriedAt,
      status: addresses.length ? 'success' : 'empty',
      addresses,
      note: addresses.length ? 'Public-looking A answers were present in the provider response.' : 'The provider returned no public A answers.',
    };
  } catch {
    return { hostname, sourceUrl, queriedAt, status: 'error', addresses: [], note: 'Request or response parsing failed.' };
  }
};

/**
 * Collects only provider-hosted, public-source observations. No generated analysis,
 * direct target requests, port probes, authenticated access, or vulnerability checks occur.
 */
export const collectPassiveSnapshot = async (
  input: string,
  fetcher: Fetcher = fetch,
): Promise<SnapshotReport> => {
  const validation = validatePublicDomain(input);
  if (validation.ok === false) throw new TargetValidationError(validation.reason);

  const observations = await Promise.all([
    collectCertificateNames(validation.domain, fetcher),
    collectTxtRecords(validation.domain, fetcher),
  ]);
  const assetNames = [...new Set(observations[0].records
    .map(record => record.value.replace(/^\*\./, ''))
    .filter(name => name !== validation.domain && isCandidateHostForDomain(name, validation.domain)))]
    .slice(0, MAX_ASSET_NAMES);
  const assetObservations = await Promise.all(assetNames.map(name => collectAssetObservation(name, fetcher)));
  const errors: CollectionError[] = [
    ...observations
      .filter((observation): observation is SourceObservation & { status: 'error'; note: string } => observation.status === 'error' && Boolean(observation.note))
      .map(observation => ({
        sourceId: observation.sourceId,
        occurredAt: observation.queriedAt,
        message: observation.note,
      })),
    ...assetObservations
      .filter(asset => asset.status === 'error' && Boolean(asset.note))
      .map(asset => ({
        sourceId: 'cloudflare-doh' as const,
        occurredAt: asset.queriedAt,
        message: `${asset.hostname}: ${asset.note}`,
      })),
  ];

  return {
    target: validation.domain,
    collectedAt: now(),
    contract: COLLECTION_SAFETY_CONTRACT,
    observations,
    assetObservations,
    errors,
    limitations: [
      'This is a point-in-time, provider-mediated observation set, not a complete asset inventory.',
      'A missing record or source error is not evidence that a record, control, or exposure is absent.',
      'Certificate names and DNS TXT records do not establish ownership, reachability, security posture, or vulnerability.',
      'No direct connection to the target is made; provider availability and response contents can vary.',
    ],
  };
};

/** Export only the collected, provider-attributed report; no interpretation is added. */
export const serializeSnapshotReport = (report: SnapshotReport): string => JSON.stringify(report, null, 2);
