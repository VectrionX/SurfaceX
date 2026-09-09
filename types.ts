export type CollectionMode = 'passive-only';
export type ObservationStatus = 'success' | 'empty' | 'error';
export type ObservationKind = 'certificate-name' | 'dns-txt';

export interface CollectionSafetyContract {
  mode: CollectionMode;
  authorizationRequired: true;
  directTargetConnections: false;
  activeProbing: false;
  credentialsAccepted: false;
  retention: 'browser-memory-only';
  egressDestinations: string[];
  excludedTargets: string[];
}

export interface ObservationRecord {
  kind: ObservationKind;
  value: string;
}

export interface SourceObservation {
  sourceId: 'crt.sh' | 'cloudflare-doh';
  sourceName: string;
  sourceUrl: string;
  classification: 'passive';
  egressDisclosure: string;
  queriedAt: string;
  status: ObservationStatus;
  records: ObservationRecord[];
  note?: string;
}

export interface PassiveAssetObservation {
  hostname: string;
  sourceUrl: string;
  queriedAt: string;
  status: ObservationStatus;
  addresses: string[];
  note?: string;
}

export interface CollectionError {
  sourceId: SourceObservation['sourceId'];
  occurredAt: string;
  message: string;
}

/** A bounded inventory of public-source observations, not a vulnerability assessment. */
export interface SnapshotReport {
  target: string;
  collectedAt: string;
  contract: CollectionSafetyContract;
  observations: SourceObservation[];
  /** DNS A answers for names already returned by the CT provider. */
  assetObservations: PassiveAssetObservation[];
  errors: CollectionError[];
  limitations: string[];
}
