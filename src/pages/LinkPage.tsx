import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSanctuary } from '../hooks/SanctuaryContext';
import type { LinkType } from '../lib/types';

const TYPES: Array<{ id: LinkType; label: string; emoji?: string; blurb: string }> = [
  {
    id: 'haptic_whisper',
    label: 'Haptic Whisper',
    blurb: 'A soft private pulse across the veil',
  },
  {
    id: 'emoji_touch',
    label: 'Emoji Touch',
    emoji: '🕯️',
    blurb: 'A small luminous sign left for them',
  },
  {
    id: 'heartbeat_presence',
    label: 'Heartbeat Presence',
    blurb: 'Let them feel you are near',
  },
];

export function LinkPage() {
  const { state, sendLink } = useSanctuary();
  const [note, setNote] = useState('Tap to send a private pulse');
  const [bloom, setBloom] = useState(false);

  function send(type: LinkType, emoji?: string) {
    sendLink(type, emoji);
    setNote(`Sent ${type.replaceAll('_', ' ')}${emoji ? ` ${emoji}` : ''}`);
    setBloom(true);
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}>
      <Link to="/" className="back-link">
        ← Sanctuary
      </Link>
      <h1 className="title">The Link</h1>
      <p className="muted">I’m Thinking of You — widget-ready pulses.</p>

      {bloom ? (
        <motion.div
          initial={{ opacity: 0.7, scale: 0.85 }}
          animate={{ opacity: 0, scale: 1.2 }}
          transition={{ duration: 0.8 }}
          onAnimationComplete={() => setBloom(false)}
          style={{
            position: 'absolute',
            left: '50%',
            top: '40%',
            width: 220,
            height: 220,
            marginLeft: -110,
            borderRadius: '50%',
            background: 'var(--glow)',
            pointerEvents: 'none',
          }}
        />
      ) : null}

      <div style={{ display: 'grid', gap: 12, marginTop: '1.25rem' }}>
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            className="panel"
            style={{ textAlign: 'left' }}
            onClick={() => send(t.id, t.emoji)}
          >
            <strong
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.4rem',
                color: 'var(--gold)',
              }}
            >
              {t.label} {t.emoji ?? ''}
            </strong>
            <div className="muted">{t.blurb}</div>
          </button>
        ))}
      </div>

      <p style={{ marginTop: '1.25rem' }}>{note}</p>
      <ul className="muted" style={{ paddingLeft: '1.1rem' }}>
        {state.links.slice(0, 6).map((l) => (
          <li key={l.id}>
            {new Date(l.createdAt).toLocaleTimeString()} — {l.type}
            {l.emoji ? ` ${l.emoji}` : ''}
          </li>
        ))}
      </ul>
    </main>
  );
}
