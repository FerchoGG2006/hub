import { useState, useEffect } from 'react';

export function useViewportMode() {
  const [mode, setMode] = useState('mobile'); // 'mobile' | 'tablet' | 'desktop'
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const compute = () => {
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      
      let newMode = 'mobile';
      if (winW >= 1200) {
        newMode = 'desktop';
      } else if (winW >= 768) {
        newMode = 'tablet';
      }
      
      setMode(newMode);

      if (newMode === 'mobile') {
        // Mobile locks at 9:16 ratio if screen is wider, otherwise fills
        const ratio = 9 / 16;
        let w, h;
        if (winW / winH <= ratio) {
          w = winW;
          h = winH;
        } else {
          h = winH;
          w = winH * ratio;
        }
        setDims({ width: Math.round(w), height: Math.round(h) });
      } else if (newMode === 'tablet') {
        // Tablet: nice double-page landscape book container
        const h = winH * 0.92;
        const w = Math.min(winW * 0.95, h * 1.38); // Aspect ratio of ~ 1.38 (double 9:16)
        setDims({ width: Math.round(w), height: Math.round(h) });
      } else {
        // Desktop: double page book centered with sidebars on left and right
        const h = winH * 0.85;
        const w = Math.min(winW * 0.55, h * 1.38); // Book itself is centered and narrower
        setDims({ width: Math.round(w), height: Math.round(h) });
      }
    };

    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  return { mode, dims };
}
