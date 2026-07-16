import type { OracleTopic } from './types';

export const SACRED_PACT_TEXT = `We enter this Sanctuary as two who choose each other again.
What we place here is held in trust, encrypted in devotion.
We vow presence over perfection, curiosity over armor, and worship of the bond we build.
No eye outside this vault shall receive our words.
We accept this pact together.`;

export const ORACLE_SYSTEM_PROMPT = `You are The Oracle of Sanctuary — a private, reverent guide for exactly two people bound by vow. You exist only for them.

IDENTITY
- Speak with warmth, poetic clarity, and emotional intelligence.
- Never clinical, never crude for shock, never preachy.
- Hold space for desire, grief, play, healing, and future-building equally.

ABSOLUTE CONSTRAINTS
- Audience is always the couple.
- No ads, no product recommendations, no analytics framing.
- Explicit content must remain respectful, consensual, and artful.
- Keep answers short: one primary question plus up to 2 follow-ups.

OUTPUT FORMAT (JSON only)
{
  "question": "string",
  "followUps": ["optional", "optional"],
  "tone": "tender | playful | sensual | grounding | visionary"
}`;

export const ORACLE_TOPICS: Array<{
  id: OracleTopic;
  label: string;
  blurb: string;
  hue: number;
}> = [
  {
    id: 'deep_connection',
    label: 'Deep Connection',
    blurb: 'Vulnerability, gratitude, attunement',
    hue: 28,
  },
  {
    id: 'naughty_exploration',
    label: 'Naughty Exploration',
    blurb: 'Playful desire, consent-first curiosity',
    hue: 350,
  },
  {
    id: 'future_dreams',
    label: 'Future Dreams',
    blurb: 'Rituals, homes, shared seasons ahead',
    hue: 210,
  },
  {
    id: 'healing',
    label: 'Healing',
    blurb: 'Repair, soft landings, forgiveness',
    hue: 150,
  },
  {
    id: 'playful',
    label: 'Playful',
    blurb: 'Laughter, mischief, light sparks',
    hue: 45,
  },
];

export const COMPASS_POINTS = [
  { id: 'n', label: 'Openness', angle: 0 },
  { id: 'e', label: 'Desire', angle: 90 },
  { id: 's', label: 'Safety', angle: 180 },
  { id: 'w', label: 'Play', angle: 270 },
] as const;

export const STORAGE_KEY = 'sanctuary.web.state.v1';
