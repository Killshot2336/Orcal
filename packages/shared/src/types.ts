/** Shared domain types for Sanctuary — the sacred space of two. */

export type PartnerId = 'A' | 'B';

export type VowType = 'daily' | 'sacred' | 'desire';

export type LinkNotificationType =
  | 'haptic_whisper'
  | 'emoji_touch'
  | 'heartbeat_presence';

export type OracleTopic =
  | 'deep_connection'
  | 'naughty_exploration'
  | 'future_dreams'
  | 'healing'
  | 'playful';

export type MemoryThreadKind = 'photo' | 'voice' | 'screenshot' | 'video';

export type VaultEntryKind = 'vent' | 'fear' | 'trust' | 'confession';

export interface CoupleBond {
  bondId: string;
  partnerAId: string;
  partnerBId: string;
  vowAcceptedAt: number;
  vowText: string;
  createdAt: number;
  /** Relationship vitality 0–100, drives Heartbeat widget. */
  heartbeatScore: number;
  /** Shared AES-GCM key fingerprint (never the raw key). */
  keyFingerprint: string;
}

export interface PartnerProfile {
  partnerId: string;
  displayName: string;
  pinHash: string;
  biometricEnabled: boolean;
  joinedAt: number;
  lastSeenAt: number;
}

export interface VowPlaque {
  id: string;
  type: VowType;
  authorId: string;
  ciphertext: string;
  nonce: string;
  createdAt: number;
  cherishCount: number;
  lastCherishedAt?: number;
  lastCherishedBy?: string;
}

export interface MemoryThread {
  id: string;
  kind: MemoryThreadKind;
  authorId: string;
  /** Encrypted storage path or blob reference. */
  mediaRef: string;
  captionCiphertext?: string;
  captionNonce?: string;
  hue: number;
  loomX: number;
  loomY: number;
  createdAt: number;
  sizeBytes: number;
}

export interface LinkPulse {
  id: string;
  fromPartnerId: string;
  type: LinkNotificationType;
  emoji?: string;
  createdAt: number;
  deliveredAt?: number;
  acknowledgedAt?: number;
}

export interface VaultEntry {
  id: string;
  authorId: string;
  kind: VaultEntryKind;
  ciphertext: string;
  nonce: string;
  createdAt: number;
  /** Both partners must unlock for mutual visibility. */
  unlockedBy: string[];
}

export interface DreamRecord {
  id: string;
  authorId: string;
  audioRef?: string;
  transcriptionCiphertext: string;
  transcriptionNonce: string;
  createdAt: number;
  themes?: string[];
  sharedThemeIds?: string[];
}

export interface BodyMapTouch {
  id: string;
  authorId: string;
  regionId: string;
  createdAt: number;
  questionCiphertext?: string;
  questionNonce?: string;
}

export interface ConstellationPoint {
  id: string;
  metric: string;
  x: number;
  y: number;
  magnitude: number;
  dayIndex: number;
}

export interface RelationshipMetrics {
  bondId: string;
  vowsShared: number;
  cherishes: number;
  memoriesWoven: number;
  oracleSessions: number;
  linkPulses: number;
  vaultEntries: number;
  dreamsShared: number;
  bodyMapTouches: number;
  daysActive: number;
  constellations: ConstellationPoint[];
}

export interface OracleRequest {
  bondId: string;
  topic: OracleTopic;
  recentVowSummaries?: string[];
  recentThemes?: string[];
  bodyRegion?: string;
  dreamThemes?: string[];
  locale?: string;
}

export interface OracleResponse {
  question: string;
  followUps: string[];
  tone: string;
  topic: OracleTopic;
  generatedAt: number;
}

export interface EncryptedPayload {
  ciphertext: string;
  nonce: string;
  algorithm: 'AES-256-GCM';
}

export interface SanctuaryThemeTokens {
  bgDeep: string;
  bgMid: string;
  bgSoft: string;
  ink: string;
  inkMuted: string;
  amber: string;
  rose: string;
  sage: string;
  gold: string;
  glow: string;
  danger: string;
  fontDisplay: string;
  fontBody: string;
}
