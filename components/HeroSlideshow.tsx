'use client';
import { useState, useEffect } from 'react';

const SLIDES = [
  { src: '/img/hero-banners/01-dental-tool-solutions.jpg', label: 'Dental Tool Solutions' },
  { src: '/img/hero-banners/02-cadcam-bur-coatings.jpg', label: 'CAD/CAM Bur Coatings' },
  { src: '/img/hero-banners/03-hand-piece-lathe.jpg', label: 'Hand Piece & Lathe' },
  { src: '/img/hero-banners/04-iso-burs.jpg', label: 'ISO Burs' },
  { src: '/img/hero-banners/05-axmills.jpg', label: 'AxMills' },
  { src: '/img/hero-banners/06-performance-coatings.jpg', label: 'Performance Coatings' },
  { src: '/img/hero-banners/07-mini-mills.jpg', label: 'Mini Mills' },
  { src: '/img/hero-banners/08-high-performance-endmills.jpg', label: 'High Performance Endmills' },
  { src: '/img/hero-banners/09-standard-endmills.jpg', label: 'Standard Endmills' },
  { src: '/img/hero-banners/10-precision-carbide-drills.jpg', label: 'Precision Carbide Drills' },
  { src: '/img/hero-banners/11-pro-plus-performance.jpg', label: 'Pro+ Performance' },
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
      {SLIDES.map((slide, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.label}
          aria-hidden={idx !== i}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: idx === i ? 1 : 0, transition: 'opacity 900ms ease',
          }}
        />
      ))}

      {/* progress dots */}
      <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6, zIndex: 2, flexWrap: 'wrap', padding: '0 12px' }}>
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Show slide ${idx + 1}`}
            style={{
              width: idx === i ? 22 : 7, height: 7, borderRadius: 999, border: 0, padding: 0, cursor: 'pointer',
              background: idx === i ? '#fff' : 'rgba(255,255,255,.55)', boxShadow: '0 1px 3px rgba(0,0,0,.35)',
              transition: 'width .35s ease, background .35s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}
