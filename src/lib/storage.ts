import { STORAGE_KEY } from './constants';
import type { SanctuaryState } from './types';

export const defaultState = (): SanctuaryState => ({
  pactAccepted: false,
  pin: null,
  unlocked: false,
  displayName: '',
  partnerName: '',
  bondId: '',
  heartbeat: 55,
  vows: [],
  memories: [],
  vault: [],
  dreams: [],
  links: [],
  lastOracleQuestion: null,
  lastOracleTone: null,
});

export function loadState(): SanctuaryState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...(JSON.parse(raw) as SanctuaryState) };
  } catch {
    return defaultState();
  }
}

export function saveState(state: SanctuaryState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clampHeartbeat(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
