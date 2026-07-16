/** Strategic haptic patterns for mobile intimacy. */

export type HapticKind = 'tap' | 'cherish' | 'linkHeartbeat' | 'linkSoft' | 'oracle' | 'success';

const PATTERNS: Record<HapticKind, number | number[]> = {
  tap: 12,
  cherish: [18, 40, 28, 40, 45], // soft squeeze
  linkHeartbeat: [35, 120, 55, 180, 35], // ba-bump
  linkSoft: [20, 60, 20],
  oracle: [15, 50, 25],
  success: [12, 40, 12],
};

export function haptic(kind: HapticKind): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    /* unsupported */
  }
}
