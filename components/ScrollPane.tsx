'use client';
import { useEffect, useRef, useState } from 'react';

// Measures the remaining space below this element down to the bottom of the
// viewport and locks its height there, so its content (the filter + product
// columns) scrolls independently instead of the whole page moving. Disabled
// below 860px — the layout stacks to a single column there, where a bounded
// pane would just feel cramped instead of the normal full-page scroll.
export function ScrollPane({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      if (!ref.current) return;
      if (window.innerWidth <= 860) {
        setHeight(null);
        return;
      }
      const top = ref.current.getBoundingClientRect().top;
      setHeight(Math.max(320, window.innerHeight - top - 24));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div ref={ref} className={className} style={{ height: height ?? undefined }}>
      {children}
    </div>
  );
}
