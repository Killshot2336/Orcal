import { useState } from 'react';
import { ChamberShell } from '../components/ChamberShell';
import { useSanctuary } from '../hooks/SanctuaryContext';
import type { VaultKind } from '../lib/types';
import { playSfx } from '../lib/soundscape';
import { haptic } from '../lib/haptics';

const KINDS: VaultKind[] = ['vent', 'fear', 'trust', 'confession'];

export function VaultPage() {
  const { state, addVault, unlockVault } = useSanctuary();
  const [gateOpen, setGateOpen] = useState(false);
  const [kind, setKind] = useState<VaultKind>('trust');
  const [text, setText] = useState('');
  const [status, setStatus] = useState('Both keys required for mutual visibility.');

  if (!gateOpen) {
    return (
      <ChamberShell
        title="Fortress Gate"
        subtitle="Beyond this seal: vents, fears, and ultimate trust."
        atmosphere="vault"
        chamberKey="vault-gate"
      >
        <p className="plaque" style={{ margin: '1.25rem 0' }}>
          Two keys. One vault. Torchlight waits.
        </p>
        <button
          className="cta"
          type="button"
          onClick={() => {
            setGateOpen(true);
            setStatus('Gate open for you. Partner unlock still required per entry.');
            void playSfx('seal');
            haptic('success');
          }}
        >
          Present Presence
        </button>
        <p className="muted" style={{ marginTop: '1rem' }}>
          {status}
        </p>
      </ChamberShell>
    );
  }

  return (
    <ChamberShell title="The Vault" subtitle={status} atmosphere="vault" chamberKey="vault">
      <div style={{ display: 'grid', gap: 12, margin: '1.25rem 0' }}>
        {state.vault.length === 0 ? (
          <div className="panel glass">
            <p className="plaque">Nothing sealed yet.</p>
          </div>
        ) : (
          state.vault.map((entry) => {
            const open = entry.unlockedBy.length >= 2;
            return (
              <article key={entry.id} className="panel glass">
                <p className="muted">
                  {entry.kind.toUpperCase()} · keys {entry.unlockedBy.length}/2
                </p>
                <p>{open ? entry.text : '•••• encrypted until mutual unlock ••••'}</p>
                {!open ? (
                  <button
                    className="cta secondary"
                    type="button"
                    style={{ marginTop: 10 }}
                    onClick={() => {
                      unlockVault(entry.id, 'partner');
                      setStatus('Mutual unlock complete — trust space open.');
                      void playSfx('success');
                      haptic('success');
                    }}
                  >
                    Simulate partner unlock
                  </button>
                ) : null}
              </article>
            );
          })
        )}
      </div>

      <section className="panel glass">
        <div className="chip-row" style={{ marginBottom: '1rem' }}>
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              className={`chip ${kind === k ? 'active' : ''}`}
              onClick={() => setKind(k)}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="vault">Write what needs a fortress</label>
          <textarea
            id="vault"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <button
          className="cta"
          type="button"
          onClick={() => {
            if (!text.trim()) return;
            addVault(kind, text);
            setText('');
            setStatus('Sealed. Awaiting second key.');
            void playSfx('seal');
            haptic('tap');
          }}
        >
          Seal Entry
        </button>
      </section>
    </ChamberShell>
  );
}
