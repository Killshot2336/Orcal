/**
 * Sanctuary visual language — warm, intimate, adaptive dusk.
 * Avoids default AI clusters: no purple-indigo glow, no cream/terracotta broadsheet.
 */

import type { SanctuaryThemeTokens } from '@sanctuary/shared';

export const colors = {
  bgDeep: '#141C1A',
  bgMid: '#1F2A27',
  bgSoft: '#2A3833',
  ink: '#F3E8D8',
  inkMuted: '#B9A992',
  amber: '#D4A574',
  rose: '#C4786A',
  sage: '#7F9F8A',
  gold: '#E6C48A',
  glow: 'rgba(212, 165, 116, 0.35)',
  danger: '#B85C5C',
  veil: 'rgba(20, 28, 26, 0.72)',
  threadPhoto: '#D4A574',
  threadVoice: '#7F9F8A',
  threadShot: '#C4786A',
  threadVideo: '#8BA7C4',
} as const;

export const fonts = {
  /**
   * Elegant serif stack — swap to @expo-google-fonts/cormorant-garamond
   * + source-serif-4 in production builds after font assets are bundled.
   */
  display: 'Georgia',
  displayItalic: 'Georgia',
  body: 'Georgia',
  bodyBold: 'Georgia',
  ui: 'Georgia',
} as const;

export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 36,
  xxl: 56,
} as const;

export const radii = {
  soft: 14,
  petal: 22,
  orb: 999,
} as const;

export const motion = {
  breath: 2400,
  cherish: 900,
  veil: 500,
  loomWeave: 1200,
  starDrift: 8000,
} as const;

export const themeTokens: SanctuaryThemeTokens = {
  bgDeep: colors.bgDeep,
  bgMid: colors.bgMid,
  bgSoft: colors.bgSoft,
  ink: colors.ink,
  inkMuted: colors.inkMuted,
  amber: colors.amber,
  rose: colors.rose,
  sage: colors.sage,
  gold: colors.gold,
  glow: colors.glow,
  danger: colors.danger,
  fontDisplay: fonts.display,
  fontBody: fonts.body,
};

export const vowTypeColor = {
  daily: colors.sage,
  sacred: colors.gold,
  desire: colors.rose,
} as const;
