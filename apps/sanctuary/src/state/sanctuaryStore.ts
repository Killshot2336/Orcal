import { create } from 'zustand';
import type {
  LinkNotificationType,
  OracleTopic,
  VowType,
} from '@sanctuary/shared';

export interface LocalVow {
  id: string;
  type: VowType;
  text: string;
  authorId: string;
  createdAt: number;
  cherishCount: number;
}

export interface LocalMemory {
  id: string;
  kind: 'photo' | 'voice' | 'screenshot' | 'video';
  caption: string;
  hue: number;
  loomX: number;
  loomY: number;
  createdAt: number;
  sizeBytes: number;
}

export interface LocalDream {
  id: string;
  text: string;
  themes: string[];
  createdAt: number;
  authorId: string;
}

export interface LocalVaultEntry {
  id: string;
  kind: 'vent' | 'fear' | 'trust' | 'confession';
  text: string;
  authorId: string;
  unlockedBy: string[];
  createdAt: number;
}

interface SanctuaryState {
  hydrated: boolean;
  pactAccepted: boolean;
  pinSet: boolean;
  unlocked: boolean;
  displayName: string;
  partnerName: string;
  bondId: string | null;
  role: 'A' | 'B' | null;
  inviteCode: string | null;
  heartbeatScore: number;
  vows: LocalVow[];
  memories: LocalMemory[];
  dreams: LocalDream[];
  vault: LocalVaultEntry[];
  lastLinkType: LinkNotificationType | null;
  lastOracleTopic: OracleTopic | null;
  lastOracleQuestion: string | null;
  simulationMode: boolean;

  setHydrated: (v: boolean) => void;
  acceptPact: (payload: {
    displayName: string;
    partnerName: string;
    bondId: string;
    role: 'A' | 'B';
    inviteCode?: string;
  }) => void;
  setPinSet: (v: boolean) => void;
  setUnlocked: (v: boolean) => void;
  setHeartbeat: (n: number) => void;
  addVow: (vow: LocalVow) => void;
  cherishVowLocal: (id: string) => void;
  addMemory: (m: LocalMemory) => void;
  addDream: (d: LocalDream) => void;
  addVault: (e: LocalVaultEntry) => void;
  unlockVaultLocal: (id: string, partnerId: string) => void;
  setLink: (t: LinkNotificationType) => void;
  setOracle: (topic: OracleTopic, question: string) => void;
  enableSimulationMode: () => void;
}

export const useSanctuaryStore = create<SanctuaryState>((set) => ({
  hydrated: false,
  pactAccepted: false,
  pinSet: false,
  unlocked: false,
  displayName: '',
  partnerName: '',
  bondId: null,
  role: null,
  inviteCode: null,
  heartbeatScore: 55,
  vows: [],
  memories: [],
  dreams: [],
  vault: [],
  lastLinkType: null,
  lastOracleTopic: null,
  lastOracleQuestion: null,
  simulationMode: false,

  setHydrated: (v) => set({ hydrated: v }),
  acceptPact: (payload) =>
    set({
      pactAccepted: true,
      displayName: payload.displayName,
      partnerName: payload.partnerName,
      bondId: payload.bondId,
      role: payload.role,
      inviteCode: payload.inviteCode ?? null,
    }),
  setPinSet: (v) => set({ pinSet: v }),
  setUnlocked: (v) => set({ unlocked: v }),
  setHeartbeat: (n) => set({ heartbeatScore: n }),
  addVow: (vow) => set((s) => ({ vows: [vow, ...s.vows] })),
  cherishVowLocal: (id) =>
    set((s) => ({
      vows: s.vows.map((v) =>
        v.id === id
          ? { ...v, cherishCount: v.cherishCount + 1 }
          : v,
      ),
      heartbeatScore: Math.min(100, s.heartbeatScore + 1),
    })),
  addMemory: (m) => set((s) => ({ memories: [m, ...s.memories] })),
  addDream: (d) => set((s) => ({ dreams: [d, ...s.dreams] })),
  addVault: (e) => set((s) => ({ vault: [e, ...s.vault] })),
  unlockVaultLocal: (id, partnerId) =>
    set((s) => ({
      vault: s.vault.map((e) =>
        e.id === id && !e.unlockedBy.includes(partnerId)
          ? { ...e, unlockedBy: [...e.unlockedBy, partnerId] }
          : e,
      ),
    })),
  setLink: (t) => set({ lastLinkType: t }),
  setOracle: (topic, question) =>
    set({ lastOracleTopic: topic, lastOracleQuestion: question }),
  enableSimulationMode: () =>
    set({
      simulationMode: true,
      pactAccepted: true,
      pinSet: true,
      unlocked: true,
      displayName: 'User A',
      partnerName: 'User B',
      bondId: 'sim-bond-001',
      role: 'A',
      heartbeatScore: 78,
    }),
}));
