import { useEffect, useRef } from 'react';

export type AtmosphereKind =
  | 'nebula'
  | 'stars'
  | 'loom'
  | 'vault'
  | 'ember'
  | 'dream'
  | 'temple';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  life: number;
}

const PALETTES: Record<AtmosphereKind, string[]> = {
  nebula: ['rgba(212,165,116,', 'rgba(196,120,106,', 'rgba(230,196,138,'],
  stars: ['rgba(243,232,216,', 'rgba(230,196,138,', 'rgba(143,180,200,'],
  loom: ['rgba(212,165,116,', 'rgba(127,159,138,', 'rgba(196,120,106,'],
  vault: ['rgba(196,140,90,', 'rgba(120,80,50,', 'rgba(230,160,90,'],
  ember: ['rgba(212,165,116,', 'rgba(196,120,106,', 'rgba(90,60,40,'],
  dream: ['rgba(127,159,138,', 'rgba(140,160,200,', 'rgba(212,165,116,'],
  temple: ['rgba(230,196,138,', 'rgba(196,120,106,', 'rgba(243,232,216,'],
};

/**
 * Living chamber atmosphere — canvas particles that drift and react to pointer.
 */
export function ChamberAtmosphere({
  kind = 'nebula',
  intensity = 1,
}: {
  kind?: AtmosphereKind;
  intensity?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const count = Math.floor(48 * intensity + (kind === 'stars' ? 40 : 0));
    const colors = PALETTES[kind];
    const particles: Particle[] = [];

    const resize = () => {
      w = canvas.width = window.innerWidth * devicePixelRatio;
      h = canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    const spawn = (): Particle => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * (kind === 'stars' ? 0.15 : 0.35),
      vy: (Math.random() - 0.5) * (kind === 'stars' ? 0.15 : 0.35),
      r: (Math.random() * 2 + 0.4) * devicePixelRatio * (kind === 'loom' ? 1.4 : 1),
      a: Math.random() * 0.45 + 0.1,
      life: Math.random(),
    });

    resize();
    for (let i = 0; i < count; i += 1) particles.push(spawn());

    const onMove = (e: PointerEvent) => {
      mouse.current.x = e.clientX / window.innerWidth;
      mouse.current.y = e.clientY / window.innerHeight;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('resize', resize);

    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      // Chamber wash
      if (kind === 'vault') {
        const g = ctx.createRadialGradient(w * 0.2, h * 0.1, 0, w * 0.2, h * 0.1, w * 0.6);
        g.addColorStop(0, 'rgba(196,140,90,0.14)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        // flickering torch
        const flicker = 0.08 + Math.sin(performance.now() / 180) * 0.03 + Math.random() * 0.02;
        const t = ctx.createRadialGradient(w * 0.15, h * 0.2, 0, w * 0.15, h * 0.2, w * 0.35);
        t.addColorStop(0, `rgba(230,160,90,${flicker})`);
        t.addColorStop(1, 'transparent');
        ctx.fillStyle = t;
        ctx.fillRect(0, 0, w, h);
      } else if (kind === 'loom') {
        ctx.strokeStyle = 'rgba(230,196,138,0.04)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 12; i += 1) {
          const y = ((performance.now() / 40 + i * 40) % (h + 80)) - 40;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.bezierCurveTo(w * 0.3, y + 20, w * 0.7, y - 20, w, y);
          ctx.stroke();
        }
      } else if (kind === 'nebula' || kind === 'ember') {
        const g = ctx.createRadialGradient(
          w * mouse.current.x,
          h * mouse.current.y,
          0,
          w * mouse.current.x,
          h * mouse.current.y,
          w * 0.45,
        );
        g.addColorStop(0, 'rgba(212,165,116,0.12)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      for (const p of particles) {
        const pullX = (mouse.current.x * w - p.x) * 0.00002;
        const pullY = (mouse.current.y * h - p.y) * 0.00002;
        p.vx += pullX;
        p.vy += pullY;
        p.x += p.vx;
        p.y += p.vy;
        p.life += 0.002;
        if (p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
          Object.assign(p, spawn());
        }
        const shimmer =
          kind === 'stars' ? 0.5 + Math.sin(p.life * 8 + p.x) * 0.5 : 1;
        const col = colors[Math.floor(p.x + p.y) % colors.length]!;
        ctx.beginPath();
        ctx.fillStyle = `${col}${(p.a * shimmer).toFixed(3)})`;
        ctx.arc(p.x, p.y, p.r * (kind === 'stars' ? shimmer : 1), 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', resize);
    };
  }, [kind, intensity]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        mixBlendMode: kind === 'vault' ? 'screen' : 'screen',
        opacity: 0.95,
      }}
    />
  );
}
