'use client';
import { useState, useEffect } from 'react';
import { Shield } from './icons';

type Slide = {
  src: string;
  headline: string;
  sub: string;
  bullets: string[];
  badges: { Icon: typeof Shield; text: string }[];
};

function Target({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" />
    </svg>
  );
}
function Bolt({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}
function Check({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const SLIDES: Slide[] = [
  {
    src: '/slots/High-Performance-End-Mills.png',
    headline: 'Premium Carbide End Mills',
    sub: 'Engineered for demanding milling operations.',
    bullets: ['Square, ball & corner radius profiles', 'Multiple flute counts', 'Uncoated & coated options'],
    badges: [{ Icon: Bolt, text: 'Higher feed rates' }, { Icon: Target, text: 'Reduced chatter' }, { Icon: Shield, text: 'Longer tool life' }],
  },
  {
    src: '/slots/drills-bits.png',
    headline: 'Precision Carbide Drills',
    sub: 'Reliable holemaking from everyday drilling to high-performance work.',
    bullets: ['Jobber & stub lengths', 'Straight & spiral flutes', 'Coolant-through options'],
    badges: [{ Icon: Shield, text: 'Rigidity & toughness' }, { Icon: Target, text: 'Consistent hole quality' }, { Icon: Bolt, text: 'Batch-to-batch precision' }],
  },
  {
    src: '/slots/burs-cover.png',
    headline: 'Solid Carbide Burs',
    sub: 'Versatile shapes for shaping, deburring and finishing.',
    bullets: ['Wide range of head shapes', 'Fine to coarse cut options', 'Die-grinder & rotary tool compatible'],
    badges: [{ Icon: Target, text: 'Precision ground' }, { Icon: Shield, text: 'Built to last' }, { Icon: Bolt, text: 'Clean finish' }],
  },
  {
    src: '/slots/reamers.png',
    headline: 'Precision Reamers',
    sub: 'Dependable sizing and finish for critical-tolerance holes.',
    bullets: ['Straight & spiral flute options', 'Fractional & metric sizes', 'Consistent bore finish'],
    badges: [{ Icon: Target, text: 'Tight tolerances' }, { Icon: Bolt, text: 'Consistent finish' }, { Icon: Shield, text: 'Built to last' }],
  },
  {
    src: '/slots/Premium-Solid-Carbide-Routers.png',
    headline: 'Solid Carbide Routers',
    sub: 'Built for wood, plastic and fiberglass routing.',
    bullets: ['Compression & spiral geometries', 'Chipbreaker options', 'Clean edge finish'],
    badges: [{ Icon: Target, text: 'Reduced chatter' }, { Icon: Bolt, text: 'Clean finish' }, { Icon: Shield, text: 'Engineered to perform' }],
  },
];

export function HeroSlideshow() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 6500);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, #0c2c19 0%, #103b21 48%, #154a2a 100%)',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* faint blueprint texture, matches the brand's engineered feel */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.5,
        backgroundImage: 'repeating-linear-gradient(135deg, rgba(212,175,55,.05) 0px, rgba(212,175,55,.05) 1px, transparent 1px, transparent 26px)',
      }} />

      {/* corner accents echoing the brand's gold/green palette */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 160, height: 160, background: 'linear-gradient(135deg, rgba(212,175,55,.5), transparent 70%)', clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 200, height: 200, background: 'linear-gradient(-45deg, rgba(212,175,55,.35), transparent 70%)', clipPath: 'polygon(100% 100%, 100% 0, 0 100%)' }} />

      {SLIDES.map((slide, idx) => (
        <div
          key={slide.src}
          aria-hidden={idx !== i}
          style={{
            position: 'absolute', inset: 0,
            opacity: idx === i ? 1 : 0, transition: 'opacity 900ms ease',
            display: 'grid', gridTemplateRows: 'auto 1fr auto', padding: '26px 28px 20px',
          }}
        >
          {/* brand mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/pct-logo.png" alt="Precision CNC Tools" style={{ height: 34, width: 34, objectFit: 'contain' }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#F1E7CB' }}>Precision CNC Tools</span>
          </div>

          {/* headline + bullets (left) / tool photo (right) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 12, alignItems: 'center', minHeight: 0 }}>
            <div style={{ minWidth: 0 }}>
              <h2 style={{
                fontSize: 'clamp(26px, 3.6vw, 38px)', lineHeight: 1.05, letterSpacing: '-.01em',
                margin: '0 0 10px', color: '#fff', fontWeight: 800,
              }}>{slide.headline}</h2>
              <p style={{ fontSize: 15, lineHeight: 1.4, color: '#d4af37', fontWeight: 600, margin: '0 0 16px', maxWidth: 320 }}>{slide.sub}</p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {slide.bullets.map((b) => (
                  <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 14, color: 'rgba(255,255,255,.9)', fontWeight: 500 }}>
                    <span style={{ color: '#d4af37', flex: 'none', marginTop: 2 }}><Check /></span>{b}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ position: 'relative', height: '100%', minHeight: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.src}
                alt={slide.headline}
                style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  maxWidth: '100%', maxHeight: '92%', objectFit: 'contain',
                  filter: 'drop-shadow(0 24px 32px rgba(0,0,0,.5))',
                }}
              />
            </div>
          </div>

          {/* why it matters badges */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 8 }}>
            {slide.badges.map(({ Icon, text }) => (
              <div key={text} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600,
                color: '#F1E7CB', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(212,175,55,.35)',
                padding: '8px 14px', borderRadius: 999,
              }}>
                <span style={{ color: '#d4af37' }}><Icon /></span>{text}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* progress dots */}
      <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8, zIndex: 2 }}>
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Show slide ${idx + 1}`}
            style={{
              width: idx === i ? 24 : 8, height: 8, borderRadius: 999, border: 0, padding: 0, cursor: 'pointer',
              background: idx === i ? '#fff' : 'rgba(255,255,255,.55)', boxShadow: '0 1px 3px rgba(0,0,0,.35)',
              transition: 'width .35s ease, background .35s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}
