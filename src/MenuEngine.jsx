import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageFlip } from 'page-flip';
import { MENU_DATA as STATIC_MENU, CATEGORY_META } from './MenuData';
import { useCart } from './useCart';
import { ProductCell } from './ProductCell';
import { EventWizard } from './EventWizard';

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
  const [showEventWizard, setShowEventWizard] = useState(false);
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
          mobileScrollSupport: false,
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


  /* ── SWIPE-BACK: Native DOM listeners in capture phase ── */
  const pageRef = useRef(0);
  useEffect(() => { pageRef.current = currentPage; }, [currentPage]);

  useEffect(() => {
    const el = bookRef.current;
    if (!el || !allMenuData) return;

    let startX = 0, startY = 0, startTime = 0;

    const onStart = (e) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    };

    const onEnd = (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const dt = Date.now() - startTime;

      // Only process dominant horizontal swipes under 600ms
      if (Math.abs(dx) > Math.abs(dy) * 1.3 && dt < 600) {
        if (dx < -50 && pflip.current) {
          // Swipe LEFT → next page
          pflip.current.flipNext();
          if (navigator.vibrate) navigator.vibrate(10);
        } else if (dx > 50 && pflip.current && pageRef.current > 0) {
          // Swipe RIGHT → previous page (reverse flip)
          pflip.current.flipPrev();
          if (navigator.vibrate) navigator.vibrate(10);
        }
      }
    };

    // Capture phase fires BEFORE page-flip's own listeners
    el.addEventListener('touchstart', onStart, { capture: true, passive: true });
    el.addEventListener('touchend', onEnd, { capture: true, passive: true });

    return () => {
      el.removeEventListener('touchstart', onStart, { capture: true });
      el.removeEventListener('touchend', onEnd, { capture: true });
    };
  }, [allMenuData]);

  if (!allMenuData) return <LoadingSkeleton />;

  const mainBranch = config.branches?.[0] || {};
  const brandColor = config?.brand_color || '#f59e0b';
  const totalPages = categories.length;

  return (
    <div className="perspective-container flex flex-col items-center justify-center overflow-hidden py-10" style={{ background: '#050505' }}>
      {/* ── CINEMATIC AMBIENCE (Brand Color Driven) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full blur-[120px]" style={{ background: `${brandColor}08` }} />
        <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-white/[0.03] blur-[120px]" />
        <div className="absolute top-[30%] right-[10%] w-[30vw] h-[30vw] rounded-full blur-[100px]" style={{ background: `${brandColor}05` }} />
      </div>


      {/* ── THE BOOK ── */}
      <div className="relative w-[92vw] max-w-[420px] aspect-[4/7] shadow-[0_80px_150px_-40px_rgba(0,0,0,1)] rounded-[3rem] overflow-hidden group">
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
              <div key={cat} className="page-item bg-[#050505] text-white overflow-hidden" data-density="soft">
                <div className="page-content h-full flex flex-col p-8 relative bg-[#050505]">
                  {/* REALISTIC SPINE RELIEF (High-Fidelity) */}
                  <div className="absolute right-0 top-0 bottom-0 w-[45px] z-30 pointer-events-none flex flex-row-reverse">
                    <div className="w-[15px] bg-gradient-to-l from-black/95 via-black/80 to-transparent" />
                    <div className="w-[1px] h-full bg-white/10 opacity-30 shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
                    <div className="w-[29px] bg-gradient-to-l from-black/40 to-transparent opacity-40" />
                  </div>

                  {/* PAPER GRAIN OVERLAY */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }} />

                  <div className="mb-8 relative z-20 pl-4">
                    <div className="flex items-center justify-between mb-4">
                      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-lg">
                            <span className="text-lg">{meta.icon}</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40" style={{ color: meta.accent }}>{meta.label}</span>
                      </motion.div>
                      <span className="text-white/5 font-mono text-[12px] italic">{String(pageIdx + 1).padStart(2, '0')}</span>
                    </div>
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white mb-3 leading-[0.8] break-words">{cat}</h2>
                    <motion.div initial={{ width: 0 }} animate={{ width: 64 }} className="h-1 rounded-full" style={{ backgroundColor: meta.accent }} />
                  </div>

                  <div className="flex-1 grid grid-cols-1 gap-4 content-start overflow-y-auto no-scrollbar pb-32 px-1 relative z-20">
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

        {/* ── PAGE NAVIGATION ARROWS ── */}
        <AnimatePresence>
          {currentPage > 0 && (
            <motion.button
              key="nav-prev"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              whileTap={{ scale: 0.85 }}
              onClick={() => { if (pflip.current) { pflip.current.flipPrev(); if (navigator.vibrate) navigator.vibrate(10); } }}
              className="absolute bottom-4 left-3 z-40 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <span className="text-white/50 text-sm font-bold select-none">‹</span>
            </motion.button>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {currentPage < totalPages - 1 && (
            <motion.button
              key="nav-next"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              whileTap={{ scale: 0.85 }}
              onClick={() => { if (pflip.current) { pflip.current.flipNext(); if (navigator.vibrate) navigator.vibrate(10); } }}
              className="absolute bottom-4 right-3 z-40 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <span className="text-white/50 text-sm font-bold select-none">›</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── FLOATING EVENT BUTTON ── */}
      <motion.button
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200, damping: 20 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setShowEventWizard(true)}
        className="fixed bottom-6 left-4 z-[200] flex items-center gap-2.5 rounded-2xl px-4 py-3"
        style={{
          background: 'rgba(245,158,11,0.12)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(245,158,11,0.25)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.1)',
        }}
      >
        <span className="text-xl leading-none">🎉</span>
        <span className="text-[9px] font-black text-amber-400 uppercase tracking-[0.2em]">Evento</span>
      </motion.button>

      {/* ── EVENT WIZARD MODAL ── */}
      <AnimatePresence>
        {showEventWizard && (
          <EventWizard
            slug={config?.slug || 'la-rivera'}
            onClose={() => setShowEventWizard(false)}
          />
        )}
      </AnimatePresence>

      {/* ── CINEMATIC PRODUCT MODAL ── */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6" onClick={() => setSelectedProduct(null)}>
            <motion.div initial={{ scale: 0.9, y: 50, rotateX: 15 }} animate={{ scale: 1, y: 0, rotateX: 0 }} exit={{ scale: 0.8, y: 50, opacity: 0 }} className="w-full max-w-sm bg-[#050505] rounded-[3.5rem] border border-white/10 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,1)]" onClick={e => e.stopPropagation()}>
              <div className="relative aspect-square">
                <img src={selectedProduct.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'} className="w-full h-full object-cover opacity-80" alt={selectedProduct.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent" />
                <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 w-12 h-12 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 hover:bg-white/10 transition-colors">✕</button>
              </div>
              <div className="px-10 pb-12 -mt-12 relative z-10 text-center">
                <div className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-amber-500">Chef Selection</span>
                </div>
                <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-4 leading-[0.8]">{selectedProduct.name}</h3>
                <p className="text-white/30 text-xs italic font-light leading-relaxed mb-10">{selectedProduct.description || 'Una experiencia gourmet diseñada para elevar tus sentidos.'}</p>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-white/20 text-sm">$</span>
                    <span className="text-4xl font-black text-white">{selectedProduct.price}</span>
                  </div>
                  <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }} className="w-full py-5 bg-white text-black rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-[0_20px_40px_rgba(255,255,255,0.2)] active:scale-95 transition-all hover:brightness-110">✦ Añadir a la Orden</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
