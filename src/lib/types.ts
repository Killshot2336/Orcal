export type VowType = 'daily' | 'sacred' | 'desire';
export type LinkType = 'haptic_whisper' | 'emoji_touch' | 'heartbeat_presence';
export type OracleTopic =
  | 'deep_connection'
  | 'naughty_exploration'
  | 'future_dreams'
  | 'healing'
  | 'playful';
export type MemoryKind = 'photo' | 'voice' | 'screenshot' | 'video';
export type VaultKind = 'vent' | 'fear' | 'trust' | 'confession';

export interface Vow {
  id: string;
  type: VowType;
  text: string;
  author: string;
  createdAt: number;
  cherishCount: number;
}

export interface Memory {
  id: string;
  kind: MemoryKind;
  caption: string;
  x: number;
  y: number;
  createdAt: number;
}

export interface VaultEntry {
  id: string;
  kind: VaultKind;
  text: string;
  author: string;
  unlockedBy: string[];
  createdAt: number;
}

export interface Dream {
  id: string;
  text: string;
  themes: string[];
  author: string;
  createdAt: number;
}

export interface LinkPulse {
  id: string;
  type: LinkType;
  emoji?: string;
  from: string;
  createdAt: number;
}

export interface SanctuaryState {
  pactAccepted: boolean;
  pin: string | null;
  unlocked: boolean;
  displayName: string;
  partnerName: string;
  bondId: string;
  heartbeat: number;
  vows: Vow[];
  memories: Memory[];
  vault: VaultEntry[];
  dreams: Dream[];
  links: LinkPulse[];
  lastOracleQuestion: string | null;
  lastOracleTone: string | null;
}
