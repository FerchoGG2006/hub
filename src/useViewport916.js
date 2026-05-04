import { useState, useEffect } from 'react';

export function useViewport916() {
  const [dims, setDims] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const compute = () => {
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const ratio = 9 / 16;
      let w, h;
      if (winW / winH <= ratio) { 
        w = winW; 
        h = winH; // Llenar toda la pantalla en móviles
      } else { 
        h = winH; 
        w = winH * ratio; 
      }
      setDims({ width: Math.round(w), height: Math.round(h) });
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);
  return dims;
}
