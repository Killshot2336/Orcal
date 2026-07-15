/**
 * Home-screen Link widget payload contract.
 * iOS WidgetKit / Android App Widgets read this via expo-apple-targets
 * or a native module bridge in production builds.
 */

import type { LinkNotificationType } from '@sanctuary/shared';

export interface LinkWidgetSnapshot {
  partnerName: string;
  lastType: LinkNotificationType | null;
  lastAt: number | null;
  heartbeatScore: number;
  phrase: string;
}

export function buildLinkWidgetSnapshot(input: {
  partnerName: string;
  lastType: LinkNotificationType | null;
  lastAt: number | null;
  heartbeatScore: number;
}): LinkWidgetSnapshot {
  const phrase =
    input.lastType === 'haptic_whisper'
      ? 'A whisper just touched the veil'
      : input.lastType === 'emoji_touch'
        ? 'A soft sign was left for you'
        : input.lastType === 'heartbeat_presence'
          ? 'Their pulse is near'
          : 'The Link is quiet — send warmth';

  return {
    partnerName: input.partnerName,
    lastType: input.lastType,
    lastAt: input.lastAt,
    heartbeatScore: input.heartbeatScore,
    phrase,
  };
}
