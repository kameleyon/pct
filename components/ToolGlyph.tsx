// Placeholder product visual until real photography is loaded.
// Subtly varies the tip by geometry (ball vs square vs corner-radius).
export function ToolGlyph({ slug }: { slug: string }) {
  const ball = slug.includes('ball');
  const radius = slug.includes('corner-radius') || slug.includes('helix');
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label="Tool illustration">
      <defs>
        <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e9e4d7" />
          <stop offset="0.5" stopColor="#cfc8b6" />
          <stop offset="1" stopColor="#b9b1a0" />
        </linearGradient>
      </defs>
      <g transform="rotate(45 100 100)">
        {/* shank */}
        <rect x="86" y="24" width="28" height="86" rx="6" fill="url(#steel)" stroke="#a79f8c" strokeWidth="1.5" />
        {/* flutes body */}
        <rect x="82" y="104" width="36" height="66" rx="7" fill="url(#steel)" stroke="#a79f8c" strokeWidth="1.5" />
        {/* flute lines */}
        <g stroke="#948b78" strokeWidth="2" opacity="0.5" fill="none">
          <path d="M86 110 L108 150" /><path d="M96 108 L116 146" /><path d="M82 122 L102 158" />
        </g>
        {/* tip */}
        {ball ? (
          <circle cx="100" cy="172" r="18" fill="url(#steel)" stroke="#a79f8c" strokeWidth="1.5" />
        ) : radius ? (
          <path d="M82 168 q0 8 8 8 h20 q8 0 8-8 v-2 h-36 z" fill="url(#steel)" stroke="#a79f8c" strokeWidth="1.5" />
        ) : (
          <rect x="82" y="164" width="36" height="8" rx="1.5" fill="url(#steel)" stroke="#a79f8c" strokeWidth="1.5" />
        )}
      </g>
    </svg>
  );
}
