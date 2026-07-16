import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { clampHeartbeat, defaultState, loadState, saveState } from '../lib/storage';
import type {
  Dream,
  LinkPulse,
  LinkType,
  Memory,
  MemoryKind,
  OracleRound,
  SanctuaryState,
  VaultEntry,
  VaultKind,
  Vow,
  VowType,
} from '../lib/types';

interface SanctuaryApi {
  state: SanctuaryState;
  acceptPact: (displayName: string, partnerName: string) => void;
  setPin: (pin: string) => void;
  unlock: (pin: string) => boolean;
  lock: () => void;
  addVow: (type: VowType, text: string) => void;
  cherishVow: (id: string) => void;
  addMemory: (kind: MemoryKind, caption: string) => void;
  sendLink: (type: LinkType, emoji?: string) => void;
  addVault: (kind: VaultKind, text: string) => void;
  unlockVault: (id: string, partnerKey: string) => void;
  addDream: (text: string) => void;
  setOracleResult: (question: string, tone: string) => void;
  pushOracleRound: (round: OracleRound) => void;
  answerLastOracle: (answer: string) => void;
  bumpHeartbeat: (by?: number) => void;
  resetAll: () => void;
}

const Ctx = createContext<SanctuaryApi | null>(null);

export function SanctuaryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SanctuaryState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const acceptPact = useCallback((displayName: string, partnerName: string) => {
    setState((s) => ({
      ...s,
      pactAccepted: true,
      displayName: displayName.trim(),
      partnerName: partnerName.trim() || 'Beloved',
      bondId: `bond-${Date.now().toString(36)}`,
      unlocked: false,
    }));
  }, []);

  const setPin = useCallback((pin: string) => {
    setState((s) => ({ ...s, pin, unlocked: true }));
  }, []);

  const unlock = useCallback(
    (pin: string) => {
      if (!state.pin || state.pin === pin) {
        setState((s) => ({ ...s, unlocked: true, pin: s.pin ?? pin }));
        return true;
      }
      return false;
    },
    [state.pin],
  );

  const lock = useCallback(() => {
    setState((s) => ({ ...s, unlocked: false }));
  }, []);

  const bumpHeartbeat = useCallback((by = 1) => {
    setState((s) => ({ ...s, heartbeat: clampHeartbeat(s.heartbeat + by) }));
  }, []);

  const addVow = useCallback((type: VowType, text: string) => {
    const vow: Vow = {
      id: `vow-${Date.now()}`,
      type,
      text: text.trim(),
      author: 'you',
      createdAt: Date.now(),
      cherishCount: 0,
    };
    setState((s) => ({
      ...s,
      vows: [vow, ...s.vows],
      heartbeat: clampHeartbeat(s.heartbeat + 2),
    }));
  }, []);

  const cherishVow = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      vows: s.vows.map((v) =>
        v.id === id ? { ...v, cherishCount: v.cherishCount + 1 } : v,
      ),
      heartbeat: clampHeartbeat(s.heartbeat + 1),
    }));
  }, []);

  const addMemory = useCallback((kind: MemoryKind, caption: string) => {
    const memory: Memory = {
      id: `mem-${Date.now()}`,
      kind,
      caption: caption.trim() || `${kind} thread`,
      x: Math.random(),
      y: Math.random(),
      createdAt: Date.now(),
    };
    setState((s) => ({
      ...s,
      memories: [memory, ...s.memories],
      heartbeat: clampHeartbeat(s.heartbeat + 1),
    }));
  }, []);

  const sendLink = useCallback((type: LinkType, emoji?: string) => {
    const pulse: LinkPulse = {
      id: `link-${Date.now()}`,
      type,
      emoji,
      from: 'you',
      createdAt: Date.now(),
    };
    setState((s) => ({
      ...s,
      links: [pulse, ...s.links].slice(0, 100),
      heartbeat: clampHeartbeat(s.heartbeat + 1),
    }));
  }, []);

  const addVault = useCallback((kind: VaultKind, text: string) => {
    const entry: VaultEntry = {
      id: `vault-${Date.now()}`,
      kind,
      text: text.trim(),
      author: 'you',
      unlockedBy: ['you'],
      createdAt: Date.now(),
    };
    setState((s) => ({ ...s, vault: [entry, ...s.vault] }));
  }, []);

  const unlockVault = useCallback((id: string, partnerKey: string) => {
    setState((s) => ({
      ...s,
      vault: s.vault.map((e) =>
        e.id === id && !e.unlockedBy.includes(partnerKey)
          ? { ...e, unlockedBy: [...e.unlockedBy, partnerKey] }
          : e,
      ),
      heartbeat: clampHeartbeat(s.heartbeat + 2),
    }));
  }, []);

  const addDream = useCallback((text: string) => {
    const themes = ['water', 'flight', 'door', 'forest', 'mirror', 'moon', 'key', 'ocean', 'light']
      .filter((w) => text.toLowerCase().includes(w));
    const dream: Dream = {
      id: `dream-${Date.now()}`,
      text: text.trim(),
      themes,
      author: 'you',
      createdAt: Date.now(),
    };
    setState((s) => ({ ...s, dreams: [dream, ...s.dreams] }));
  }, []);

  const setOracleResult = useCallback((question: string, tone: string) => {
    setState((s) => ({
      ...s,
      lastOracleQuestion: question,
      lastOracleTone: tone,
      heartbeat: clampHeartbeat(s.heartbeat + 1),
    }));
  }, []);

  const pushOracleRound = useCallback((round: OracleRound) => {
    setState((s) => ({
      ...s,
      oracleHistory: [...(s.oracleHistory ?? []), round].slice(-40),
      lastOracleQuestion: round.question,
      lastOracleTone: s.lastOracleTone,
      heartbeat: clampHeartbeat(s.heartbeat + 1),
    }));
  }, []);

  const answerLastOracle = useCallback((answer: string) => {
    setState((s) => {
      const hist = [...(s.oracleHistory ?? [])];
      if (!hist.length) return s;
      const last = { ...hist[hist.length - 1]!, answer: answer.trim() };
      hist[hist.length - 1] = last;
      return { ...s, oracleHistory: hist };
    });
  }, []);

  const resetAll = useCallback(() => {
    const next = defaultState();
    setState(next);
    saveState(next);
  }, []);

  const api = useMemo(
    () => ({
      state,
      acceptPact,
      setPin,
      unlock,
      lock,
      addVow,
      cherishVow,
      addMemory,
      sendLink,
      addVault,
      unlockVault,
      addDream,
      setOracleResult,
      pushOracleRound,
      answerLastOracle,
      bumpHeartbeat,
      resetAll,
    }),
    [
      state,
      acceptPact,
      setPin,
      unlock,
      lock,
      addVow,
      cherishVow,
      addMemory,
      sendLink,
      addVault,
      unlockVault,
      addDream,
      setOracleResult,
      pushOracleRound,
      answerLastOracle,
      bumpHeartbeat,
      resetAll,
    ],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useSanctuary(): SanctuaryApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSanctuary must be used within SanctuaryProvider');
  return ctx;
}
