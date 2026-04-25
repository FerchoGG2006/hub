import React, { useState, useRef, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { PageFlip } from 'page-flip';
import { MENU_DATA as STATIC_MENU, CATEGORY_META } from './MenuData';
import { useCart } from './useCart';
import { ProductCell } from './ProductCell';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const LoadingSkeleton = () => (
  <div className="perspective-container bg-black flex items-center justify-center">
    <div className="w-[85vw] max-w-[350px] h-[70vh] rounded-[2.5rem] animate-pulse bg-white/5 border border-white/10 flex flex-col p-8 space-y-4">
      <div className="h-4 w-24 rounded-lg bg-white/10" />
      <div className="h-10 w-48 rounded-lg bg-white/10" />
      <div className="space-y-3 mt-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-2xl w-full bg-white/5" />
        ))}
      </div>
    </div>
  </div>
);

export const MenuEngine = ({ config }) => {
  const { addToCart } = useCart();
  const [allMenuData, setAllMenuData] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const bookRef = useRef(null);
  const pflip = useRef(null);

  /* ── FETCH MENU ── */
  useEffect(() => {
    const tenantSlug = config?.slug || 'la-rivera';
    (async () => {
      try {
        const [menuRes, catsRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/tenant/${tenantSlug}/menu`, { signal: AbortSignal.timeout(4000) }),
          fetch(`${API_URL}/api/v1/tenant/${tenantSlug}/categories`, { signal: AbortSignal.timeout(4000) })
        ]);
        if (!menuRes.ok) throw new Error(`HTTP ${menuRes.status}`);
        const data = await menuRes.json();
        const catsData = await catsRes.json().catch(() => []);

        const FALLBACK_ACCENTS = ['#10b981', '#f97316', '#f59e0b', '#06b6d4', '#ec4899'];
        catsData.forEach((c, idx) => {
          if (!CATEGORY_META[c.name]) {
            CATEGORY_META[c.name] = { accent: FALLBACK_ACCENTS[idx % FALLBACK_ACCENTS.length], icon: c.icon || '🍽️', label: c.name };
          }
        });

        const paginated = {};
        Object.keys(data).forEach(catName => {
          const prods = data[catName];
          if (prods.length <= 4) { paginated[catName] = prods; }
          else {
            for (let i = 0; i < prods.length; i += 4) {
              const pn = Math.floor(i / 4) + 1;
              const key = i === 0 ? catName : `${catName} ${pn}`;
              paginated[key] = prods.slice(i, i + 4);
              if (i > 0 && CATEGORY_META[catName]) {
                CATEGORY_META[key] = { ...CATEGORY_META[catName], label: `${CATEGORY_META[catName].label || catName} Pt. ${pn}` };
              }
            }
          }
        });
        setAllMenuData(paginated);
      } catch { 
        setAllMenuData(STATIC_MENU);
      }
    })();
  }, [config?.slug]);

  /* ── INIT PAGE-FLIP ── */
  useEffect(() => {
    if (!allMenuData || !bookRef.current) return;

    const timer = setTimeout(() => {
      try {
        if (pflip.current) pflip.current.destroy();

        pflip.current = new PageFlip(bookRef.current, {
          width: 400,
          height: 700,
          size: 'stretch',
          minWidth: 280,
          maxWidth: 450,
          minHeight: 480,
          maxHeight: 850,
          maxShadowOpacity: 0.6,
          showCover: false,
          mobileScrollSupport: true,
          usePortrait: true,
          flippingTime: 1200,
          swipeDistance: 12,
          showPageCorners: true,
          disableFlipByClick: true,
          autoSize: true,
          direction: 'rtl'
        });

        // Global exposing for reset on order completion
        window.pflipInstance = pflip.current;

        const pages = document.querySelectorAll('.page-item');
        if (pages.length > 0) {
          pflip.current.loadFromHTML(pages);
          pflip.current.on('flip', (e) => setCurrentPage(e.data));
        }
      } catch (e) {
        console.error('PageFlip init error:', e);
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (pflip.current) { try { pflip.current.destroy(); } catch { /* cleanup */ } }
    };
  }, [allMenuData]);

  /* ── NAVIGATION ── */
  const categories = allMenuData ? Object.keys(allMenuData) : [];

  const goToPage = (idx) => {
    if (pflip.current && idx >= 0 && idx < categories.length) {
      pflip.current.turnToPage(idx);
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  if (!allMenuData) return <LoadingSkeleton />;

  return (
    <div className="perspective-container flex flex-col items-center justify-center bg-black overflow-hidden py-10">
      {/* ── TOP CATEGORY BAR ── */}
      <div className="fixed top-4 left-0 right-0 z-[200] pointer-events-none">
        <div className="flex justify-center px-4">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto px-4 py-2 rounded-full bg-black/60 backdrop-blur-3xl border border-white/10 shadow-2xl max-w-full">
            {categories.map((c, i) => {
              const m = CATEGORY_META[c] || { icon: '🍽️', label: c };
              const active = i === currentPage;
              return (
                <button key={c} onClick={() => goToPage(i)} className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-500 ${active ? 'bg-white/10' : ''}`}>
                  <span className="text-sm" style={{ opacity: active ? 1 : 0.4 }}>{m.icon}</span>
                  {active && <span className="text-[8px] font-black uppercase tracking-widest text-white">{m.label}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── THE BOOK ── */}
      <div className="relative w-[94vw] max-w-[420px] aspect-[4/7] shadow-[0_60px_150px_-30px_rgba(0,0,0,1)] rounded-[2.8rem] overflow-hidden">
        <div 
          ref={bookRef} 
          className="w-full h-full" 
          style={{ 
            touchAction: 'none',
            pointerEvents: document.body.classList.contains('checkout-open') ? 'none' : 'auto'
          }}
        >
          {categories.map((cat, pageIdx) => {
            const items = allMenuData[cat] || [];
            const meta = CATEGORY_META[cat] || { accent: '#fff', icon: '🍽️', label: cat };
            return (
              <div key={cat} className="page-item bg-[#0a0a0a] text-white overflow-hidden" data-density="soft">
                <div className="page-content h-full flex flex-col p-7 relative bg-[#0a0a0a]">
                  {/* 3D SPINE RELIEF (inverted for RTL) */}
                  <div className="absolute right-0 top-0 bottom-0 w-[40px] z-30 pointer-events-none flex flex-row-reverse">
                    <div className="w-[12px] bg-gradient-to-l from-black/90 to-transparent" />
                    <div className="w-[1px] h-full bg-white/5" />
                    <div className="w-[27px] bg-gradient-to-l from-black/40 to-transparent opacity-50" />
                  </div>

                  <div className="mb-6 relative z-20 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{meta.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: meta.accent }}>{meta.label}</span>
                      </div>
                      <span className="text-white/10 font-mono text-[10px]">{String(pageIdx + 1).padStart(2, '0')}</span>
                    </div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white mb-2 leading-none break-words">{cat}</h2>
                    <div className="h-0.5 w-16 rounded-full" style={{ backgroundColor: meta.accent }} />
                  </div>

                  <div className="flex-1 grid grid-cols-1 gap-3 content-start overflow-y-auto no-scrollbar pb-20 px-1 relative z-20">
                    {items.map((item, idx) => (
                      <ProductCell
                        key={item.id} item={item} index={idx} accent={meta.accent}
                        onAdd={() => addToCart(item)} onClick={() => setSelectedProduct(item)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>



      {/* ── CINEMATIC PRODUCT MODAL ── */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6" onClick={() => setSelectedProduct(null)}>
            <motion.div initial={{ scale: 0.9, y: 50, rotateX: 15 }} animate={{ scale: 1, y: 0, rotateX: 0 }} exit={{ scale: 0.8, y: 50, opacity: 0 }} className="w-full max-w-sm bg-[#050505] rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="relative aspect-square">
                <img src={selectedProduct.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'} className="w-full h-full object-cover opacity-80" alt={selectedProduct.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent" />
                <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center text-white border border-white/10">✕</button>
              </div>
              <div className="px-8 pb-10 -mt-10 relative z-10 text-center">
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-amber-500 mb-2 block">Chef Selection</span>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-4 leading-[0.9]">{selectedProduct.name}</h3>
                <p className="text-white/40 text-xs italic font-light leading-relaxed mb-8">{selectedProduct.description || 'Una experiencia gourmet única.'}</p>
                <div className="flex flex-col gap-3">
                  <span className="text-2xl font-black text-white">${selectedProduct.price}</span>
                  <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all">Añadir</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
