import { ORACLE_SYSTEM_PROMPT, ORACLE_TOPICS } from './constants';
import type { OracleTopic } from './types';

export interface QaRound {
  question: string;
  answer?: string;
  topic: OracleTopic;
  intensity: number;
  at: number;
}

export interface OracleRequest {
  bondId: string;
  topic: OracleTopic;
  intensity: number;
  compass: string;
  recentVowSummaries?: string[];
  /** Last 5 Q&A rounds for context-aware generation. */
  history?: QaRound[];
  pauseReason?: string;
  mode?: 'question' | 'redirect' | 'analyst';
  analystPrompt?: string;
}

export interface OracleResponse {
  question: string;
  followUps: string[];
  tone: string;
  topic: OracleTopic;
  suggestedTopic?: OracleTopic;
  suggestedTopicReason?: string;
  source: 'api' | 'mock';
  generatedAt: number;
  analystReply?: string;
}

const FALLBACK: Record<OracleTopic, string[]> = {
  deep_connection: [
    'When you two feel most unlocked with each other, what quiet signal tells you it is safe to go deeper?',
    'What part of your partner’s ordinary day do you secretly cherish as sacred?',
    'If gratitude had a color tonight, what shade would you wrap around each other?',
    'What unspoken gratitude have you been carrying that wants a soft landing tonight?',
  ],
  naughty_exploration: [
    'What gentle boundary would make desire feel safer and more delicious between you tonight?',
    'Is there a pace of touch you have never asked for but have always wanted to receive?',
    'What playful invitation could you offer that leaves room for either of you to say “not now” with love?',
    'Where does curiosity live in your body when you look at each other right now?',
  ],
  future_dreams: [
    'What small ritual would you like your future selves to still practice ten years from now?',
    'If this bond were a place you could visit, what season would the land always be in?',
    'What adventure would ask both of you to grow just one brave inch?',
    'What do you want your shared evenings to feel like when life gets quieter?',
  ],
  healing: [
    'What soft landing would help the less steady nervous system in this bond feel held right now?',
    'Where in your shared story do you still need a redo that ends in warmth instead of winning?',
    'What apology language lands as love for you, and how might you teach it without blame?',
    'What would make repair feel less like a trial and more like a reunion?',
  ],
  playful: [
    'If tonight’s mood were a mischievous animal, what would it steal from the kitchen and why?',
    'Invent a two-person holiday that lasts only twenty minutes — what happens first?',
    'What ridiculous nickname would you award each other for surviving this week’s chaos?',
    'What inside joke deserves a tiny ceremony of celebration tonight?',
  ],
};

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) | 0;
  return h;
}

function toneFor(topic: OracleTopic): string {
  const map: Record<OracleTopic, string> = {
    deep_connection: 'tender',
    naughty_exploration: 'sensual',
    future_dreams: 'visionary',
    healing: 'grounding',
    playful: 'playful',
  };
  return map[topic];
}

function contextualFollowUps(req: OracleRequest, question: string): string[] {
  const last = req.history?.slice(-1)[0];
  const deep =
    (last?.answer && last.answer.length > 80) || req.intensity >= 7
      ? [
          'That sounds important. Would you like to explore why that memory or feeling stands out?',
          'If you stayed with that feeling for three more breaths, what would it ask for?',
        ]
      : [
          'Would you like a softer companion question beside this one?',
          'What would make answering this feel safer between you?',
        ];

  const bank = FALLBACK[req.topic].filter((q) => q !== question);
  return [...deep.slice(0, 1), ...bank.slice(0, 1)].slice(0, 2);
}

function mockQuestion(req: OracleRequest): OracleResponse {
  const bank = FALLBACK[req.topic];
  const seed = hashSeed(
    `${req.bondId}:${req.topic}:${req.intensity}:${req.compass}:${req.history?.length ?? 0}:${req.history?.at(-1)?.answer ?? ''}`,
  );
  let question = bank[Math.abs(seed) % bank.length]!;

  if (req.history?.length) {
    question = `${question} Holding your last exchange in mind, answer as if your bond is listening.`;
  }
  if (req.intensity >= 8) question += ' Go one layer deeper than comfort.';
  if (req.intensity <= 3) question += ' Keep the landing especially soft.';
  question += ` (Compass: ${req.compass}.)`;

  return {
    question,
    followUps: contextualFollowUps(req, bank[Math.abs(seed) % bank.length]!),
    tone: toneFor(req.topic),
    topic: req.topic,
    source: 'mock',
    generatedAt: Date.now(),
  };
}

function mockRedirect(req: OracleRequest): OracleResponse {
  const reason = (req.pauseReason || '').toLowerCase();
  let suggested: OracleTopic = 'healing';
  let why =
    'A gentler field may help the nervous system settle before returning to depth.';

  if (reason.includes('insecur') || reason.includes('afraid') || reason.includes('shame')) {
    suggested = 'deep_connection';
    why =
      'When insecurity rises, Worship-adjacent attunement and soft witnessing often restore safety before desire or intensity.';
  } else if (reason.includes('tired') || reason.includes('overwhelm')) {
    suggested = 'playful';
    why = 'Lightness can reopen the door without pressure when the system is tired.';
  } else if (reason.includes('desire') || reason.includes('want')) {
    suggested = 'naughty_exploration';
    why = 'Desire itself may want a clearer, consent-forward invitation.';
  } else if (reason.includes('future') || reason.includes('plan')) {
    suggested = 'future_dreams';
    why = 'Future-dreaming can reorient the bond toward shared hope.';
  }

  const soft = FALLBACK[suggested][0]!;
  return {
    question: soft,
    followUps: [
      'Would you like to enter that softer topic together now?',
      'Or stay here with a gentler version of the original compass?',
    ],
    tone: toneFor(suggested),
    topic: suggested,
    suggestedTopic: suggested,
    suggestedTopicReason: why,
    source: 'mock',
    generatedAt: Date.now(),
  };
}

function mockAnalyst(req: OracleRequest): OracleResponse {
  const prompt = req.analystPrompt?.trim() || 'Offer strategic warmth for this bond.';
  const hist = (req.history ?? [])
    .slice(-5)
    .map((h, i) => `${i + 1}. Q: ${h.question}${h.answer ? ` / A: ${h.answer.slice(0, 120)}` : ''}`)
    .join('\n');

  const reply = [
    'Analyst mode (Sanctuary Intelligence — private mock):',
    '',
    `You asked: ${prompt}`,
    '',
    hist
      ? `Reading the last threads:\n${hist}\n\nStrategic read: prioritize nervous-system safety before intensity. Name one appreciation out loud, then invite one curiosity question with an easy exit.`
      : 'No recent Q&A yet. Begin with gratitude, then one soft curiosity. Avoid diagnosing; invite.',
    '',
    'Suggested next move: Deep Connection at intensity 3–4 with Compass set to Safety.',
  ].join('\n');

  return {
    question: 'Analyst counsel ready.',
    followUps: [],
    tone: 'strategic',
    topic: req.topic,
    source: 'mock',
    generatedAt: Date.now(),
    analystReply: reply,
  };
}

/**
 * Sanctuary Intelligence — private API with rich mock fallback.
 * Sends topic, intensity, compass, and last 5 Q&A rounds.
 */
export async function askOracle(req: OracleRequest): Promise<OracleResponse> {
  const apiUrl = import.meta.env.VITE_ORACLE_API_URL;
  const mode = req.mode ?? 'question';

  if (apiUrl) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'sanctuary-oracle-v1',
          mode,
          messages: [
            { role: 'system', content: ORACLE_SYSTEM_PROMPT },
            {
              role: 'user',
              content: JSON.stringify({
                mode,
                topic: req.topic,
                intensity: req.intensity,
                compass: req.compass,
                pauseReason: req.pauseReason,
                analystPrompt: req.analystPrompt,
                history: (req.history ?? []).slice(-5),
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
          suggestedTopic?: OracleTopic;
          suggestedTopicReason?: string;
          analystReply?: string;
          choices?: Array<{ message?: { content?: string } }>;
        };
        let parsed = data;
        const content = data.choices?.[0]?.message?.content;
        if (content) parsed = JSON.parse(content) as typeof data;
        if (parsed.question || parsed.analystReply) {
          return {
            question: parsed.question ?? 'Analyst counsel ready.',
            followUps: (parsed.followUps ?? []).slice(0, 2),
            tone: parsed.tone ?? 'tender',
            topic: parsed.suggestedTopic ?? req.topic,
            suggestedTopic: parsed.suggestedTopic,
            suggestedTopicReason: parsed.suggestedTopicReason,
            analystReply: parsed.analystReply,
            source: 'api',
            generatedAt: Date.now(),
          };
        }
      }
    } catch {
      /* fall through to mock */
    }
  }

  await new Promise((r) => setTimeout(r, 420 + Math.random() * 480));
  if (mode === 'redirect') return mockRedirect(req);
  if (mode === 'analyst') return mockAnalyst(req);
  return mockQuestion(req);
}
