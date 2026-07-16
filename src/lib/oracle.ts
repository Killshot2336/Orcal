import { ORACLE_SYSTEM_PROMPT, ORACLE_TOPICS } from './constants';
import type { OracleTopic } from './types';

export interface OracleRequest {
  bondId: string;
  topic: OracleTopic;
  intensity: number; // 1–10
  compass: string; // Openness | Desire | Safety | Play
  recentVowSummaries?: string[];
}

export interface OracleResponse {
  question: string;
  followUps: string[];
  tone: string;
  topic: OracleTopic;
  source: 'api' | 'offline';
  generatedAt: number;
}

const FALLBACK: Record<OracleTopic, string[]> = {
  deep_connection: [
    'When you two feel most unlocked with each other, what quiet signal tells you it is safe to go deeper?',
    'What part of your partner’s ordinary day do you secretly cherish as sacred?',
    'If gratitude had a color tonight, what shade would you wrap around each other?',
  ],
  naughty_exploration: [
    'What gentle boundary would make desire feel safer and more delicious between you tonight?',
    'Is there a pace of touch you have never asked for but have always wanted to receive?',
    'What playful invitation could you offer that leaves room for either of you to say “not now” with love?',
  ],
  future_dreams: [
    'What small ritual would you like your future selves to still practice ten years from now?',
    'If this bond were a place you could visit, what season would the land always be in?',
    'What adventure would ask both of you to grow just one brave inch?',
  ],
  healing: [
    'What soft landing would help the less steady nervous system in this bond feel held right now?',
    'Where in your shared story do you still need a redo that ends in warmth instead of winning?',
    'What apology language lands as love for you, and how might you teach it without blame?',
  ],
  playful: [
    'If tonight’s mood were a mischievous animal, what would it steal from the kitchen and why?',
    'Invent a two-person holiday that lasts only twenty minutes — what happens first?',
    'What ridiculous nickname would you award each other for surviving this week’s chaos?',
  ],
};

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) | 0;
  return h;
}

function offlineOracle(req: OracleRequest): OracleResponse {
  const bank = FALLBACK[req.topic];
  const seed = hashSeed(`${req.bondId}:${req.topic}:${req.intensity}:${req.compass}`);
  const question = bank[Math.abs(seed) % bank.length]!;
  const followUps = bank.filter((q) => q !== question).slice(0, 2);
  const toneByTopic: Record<OracleTopic, string> = {
    deep_connection: 'tender',
    naughty_exploration: 'sensual',
    future_dreams: 'visionary',
    healing: 'grounding',
    playful: 'playful',
  };

  const intensityNote =
    req.intensity >= 8
      ? ' Let this one go a layer deeper than usual.'
      : req.intensity <= 3
        ? ' Keep the landing especially soft.'
        : '';

  return {
    question: `${question} (Compass: ${req.compass}.)${intensityNote}`,
    followUps,
    tone: toneByTopic[req.topic],
    topic: req.topic,
    source: 'offline',
    generatedAt: Date.now(),
  };
}

/**
 * Placeholder Oracle API integration.
 * Set VITE_ORACLE_API_URL to a real endpoint; otherwise the offline bank answers.
 */
export async function askOracle(req: OracleRequest): Promise<OracleResponse> {
  const apiUrl = import.meta.env.VITE_ORACLE_API_URL;

  if (apiUrl) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'sanctuary-oracle-v1',
          messages: [
            { role: 'system', content: ORACLE_SYSTEM_PROMPT },
            {
              role: 'user',
              content: JSON.stringify({
                topic: req.topic,
                intensity: req.intensity,
                compass: req.compass,
                recentVowSummaries: req.recentVowSummaries?.slice(0, 4) ?? [],
                topicLabel: ORACLE_TOPICS.find((t) => t.id === req.topic)?.label,
              }),
            },
          ],
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          question?: string;
          followUps?: string[];
          tone?: string;
          choices?: Array<{ message?: { content?: string } }>;
        };

        let parsed = data;
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          parsed = JSON.parse(content) as typeof data;
        }

        if (parsed.question) {
          return {
            question: parsed.question,
            followUps: (parsed.followUps ?? []).slice(0, 2),
            tone: parsed.tone ?? 'tender',
            topic: req.topic,
            source: 'api',
            generatedAt: Date.now(),
          };
        }
      }
    } catch {
      // Fall through to offline bank — Sanctuary never fails into silence.
    }
  }

  // Simulate network latency for a living chamber feel.
  await new Promise((r) => setTimeout(r, 450 + Math.random() * 400));
  return offlineOracle(req);
}
