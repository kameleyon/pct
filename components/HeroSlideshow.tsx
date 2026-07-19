'use client';
import { useState, useEffect } from 'react';

const SLIDES = [
  '/slots/landing1.png',
  '/slots/landing2.png',
  '/slots/landing3.png',
  '/slots/landing4.png',
  '/slots/landing5.png',
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
      style={{ position: 'absolute', inset: 0 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SLIDES.map((src, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden={idx !== i}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: idx === i ? 1 : 0, transition: 'opacity 900ms ease',
          }}
        />
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
