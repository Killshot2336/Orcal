import { ORACLE_SYSTEM_PROMPT } from './oracle-prompt';
import type { OracleRequest, OracleResponse, OracleTopic } from './types';

const FALLBACK_BANK: Record<OracleTopic, string[]> = {
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

function pick<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length];
}

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return h;
}

export function offlineOracle(req: OracleRequest): OracleResponse {
  const bank = FALLBACK_BANK[req.topic];
  const seed = hashSeed(
    `${req.bondId}:${req.topic}:${req.bodyRegion ?? ''}:${(req.dreamThemes ?? []).join(',')}`,
  );
  let question = pick(bank, seed);
  const followUps = [pick(bank, seed + 1), pick(bank, seed + 2)].filter(
    (q) => q !== question,
  );

  const toneByTopic: Record<OracleTopic, string> = {
    deep_connection: 'tender',
    naughty_exploration: 'sensual',
    future_dreams: 'visionary',
    healing: 'grounding',
    playful: 'playful',
  };

  if (req.bodyRegion) {
    question = `${question} (Let the ${req.bodyRegion} be your quiet compass as you answer.)`;
  }

  return {
    question,
    followUps: followUps.slice(0, 2),
    tone: toneByTopic[req.topic],
    topic: req.topic,
    generatedAt: Date.now(),
  };
}

export async function invokeOracle(req: OracleRequest): Promise<OracleResponse> {
  const apiUrl = process.env.SANCTUARY_ORACLE_API_URL;
  const apiKey = process.env.SANCTUARY_ORACLE_API_KEY;

  if (apiUrl && apiKey) {
    try {
      const remote = await callPrivateOracleApi(apiUrl, apiKey, req);
      if (remote) return remote;
    } catch {
      // Fall through
    }
  }

  return offlineOracle(req);
}

async function callPrivateOracleApi(
  apiUrl: string,
  apiKey: string,
  req: OracleRequest,
): Promise<OracleResponse | null> {
  const userContent = JSON.stringify({
    topic: req.topic,
    bodyRegion: req.bodyRegion,
    recentThemes: req.recentThemes?.slice(0, 6) ?? [],
    dreamThemes: req.dreamThemes?.slice(0, 6) ?? [],
    recentVowSummaries: req.recentVowSummaries?.slice(0, 4) ?? [],
  });

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.SANCTUARY_ORACLE_MODEL ?? 'sanctuary-oracle-v1',
      temperature: 0.85,
      messages: [
        { role: 'system', content: ORACLE_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  const parsed = JSON.parse(content) as {
    question?: string;
    followUps?: string[];
    tone?: string;
  };

  if (!parsed.question) return null;

  return {
    question: parsed.question.trim(),
    followUps: (parsed.followUps ?? []).slice(0, 2).map((f) => f.trim()),
    tone: parsed.tone ?? 'tender',
    topic: req.topic,
    generatedAt: Date.now(),
  };
}
