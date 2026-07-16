import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChamberShell } from '../components/ChamberShell';
import { useSanctuary } from '../hooks/SanctuaryContext';
import type { LinkType } from '../lib/types';
import { haptic } from '../lib/haptics';
import { playSfx } from '../lib/soundscape';

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
    void playSfx('link');
    if (type === 'heartbeat_presence') haptic('linkHeartbeat');
    else if (type === 'haptic_whisper') haptic('linkSoft');
    else haptic('tap');
    window.setTimeout(() => setBloom(false), 900);
  }

  return (
    <ChamberShell
      title="The Link"
      subtitle="I’m Thinking of You — widget-ready pulses with heartbeat haptics."
      atmosphere="nebula"
      chamberKey="link"
      ambientOverride="link"
    >
      {bloom ? (
        <motion.div
          initial={{ opacity: 0.7, scale: 0.85 }}
          animate={{ opacity: 0, scale: 1.25 }}
          transition={{ duration: 0.85 }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '38%',
            width: 220,
            height: 220,
            marginLeft: -110,
            borderRadius: '50%',
            background: 'var(--glow)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      ) : null}

      <div style={{ display: 'grid', gap: 12, marginTop: '1.25rem' }}>
        {TYPES.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            className="panel glass"
            style={{ textAlign: 'left' }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
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
          </motion.button>
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
    </ChamberShell>
  );
}
