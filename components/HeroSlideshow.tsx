'use client';
import { useState, useEffect } from 'react';

const SLIDES = [
  { src: '/slots/High-Performance-End-Mills.png', label: 'Premium Carbide End Mills' },
  { src: '/slots/drills-bits.png', label: 'Jobber & Carbide Drills' },
  { src: '/slots/burs-cover.png', label: 'Solid Carbide Burs' },
  { src: '/slots/reamers.png', label: 'Precision Reamers' },
  { src: '/slots/Premium-Solid-Carbide-Routers.png', label: 'Solid Carbide Routers' },
];

export function HeroSlideshow() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 5000);
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
      <div style={{ position: 'absolute', top: 0, left: 0, width: 160, height: 160, background: 'linear-gradient(135deg, rgba(212,175,55,.55), transparent 70%)', clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 200, height: 200, background: 'linear-gradient(-45deg, rgba(212,175,55,.4), transparent 70%)', clipPath: 'polygon(100% 100%, 100% 0, 0 100%)' }} />

      {SLIDES.map((slide, idx) => (
        <div
          key={slide.src}
          aria-hidden={idx !== i}
          style={{
            position: 'absolute', inset: 0,
            opacity: idx === i ? 1 : 0, transition: 'opacity 900ms ease',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.src}
            alt={slide.label}
            style={{
              position: 'absolute', top: '46%', left: '50%', transform: 'translate(-50%, -50%)',
              maxWidth: '82%', maxHeight: '72%', objectFit: 'contain',
              filter: 'drop-shadow(0 24px 36px rgba(0,0,0,.5))',
            }}
          />
          <div style={{
            position: 'absolute', left: 28, bottom: 60, zIndex: 2,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase',
            color: '#F1E7CB', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(212,175,55,.35)',
            padding: '8px 16px', borderRadius: 999, backdropFilter: 'blur(2px)',
          }}>{slide.label}</div>
        </div>
      ))}

      {/* progress dots */}
      <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8, zIndex: 2 }}>
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
