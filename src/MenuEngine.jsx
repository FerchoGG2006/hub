import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageFlip } from 'page-flip';
import { MENU_DATA as STATIC_MENU, CATEGORY_META } from './MenuData';
import { useCart } from './useCart';
import { EventWizard } from './EventWizard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/* ─────────────────────────────────────────────────────────────
   HOOK: Resolves the 9:16 container dimensions on any device.
   Returns { width, height } of the rendered viewport box.
   - On portrait phones  → fills 100vw × 100svh
   - On wide screens     → centred column, height = 100svh,
                           width  = svh × (9/16)
───────────────────────────────────────────────────────────── */
function useViewport916() {
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const compute = () => {
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const targetRatio = 9 / 16;
      const windowRatio = winW / winH;

      let w, h;
      if (windowRatio <= targetRatio) {
        // Window taller or equal → fit by width
        w = winW;
        h = winW / targetRatio;
      } else {
        // Window wider → fit by height, pillarbox
        h = winH;
        w = winH * targetRatio;
      }
      setDims({ width: Math.round(w), height: Math.round(h) });
    };

    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  return dims;
}

/* ═══════════════════════════════════════════════════════════════
   CORNER PEEL — MEJORA B
   CSS-only animated page-curl hint. Appears after 2.5s idle,
   disappears permanently after first interaction.
═══════════════════════════════════════════════════════════════ */
const CornerPeel = ({ visible, accent }) => (
  <AnimatePresence>
    {visible && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position:'absolute', bottom:70, right:0, width:52, height:52, pointerEvents:'none', zIndex:50 }}>
        <motion.div animate={{ opacity:[0.18,0.35,0.18] }} transition={{ duration:2.2, repeat:Infinity, ease:'easeInOut' }}
          style={{ position:'absolute', bottom:0, right:0, width:44, height:44,
            background:'radial-gradient(ellipse at 100% 100%, rgba(0,0,0,0.28) 0%, transparent 70%)', borderRadius:'0 0 0 100%' }} />
        <motion.div animate={{ width:[28,38,28], height:[28,38,28] }} transition={{ duration:2.2, repeat:Infinity, ease:'easeInOut' }}
          style={{ position:'absolute', bottom:0, right:0, background:`linear-gradient(135deg, ${accent}30 0%, #f0e8d0 60%, #e8dcc0 100%)`,
            clipPath:'polygon(100% 0, 100% 100%, 0 100%)', borderLeft:'0.5px solid rgba(184,120,32,0.2)', borderTop:'0.5px solid rgba(184,120,32,0.15)' }} />
        <motion.div animate={{ opacity:[0.5,1,0.5] }} transition={{ duration:2.2, repeat:Infinity, ease:'easeInOut' }}
          style={{ position:'absolute', bottom:5, right:5, fontSize:9, color:accent, fontWeight:900, lineHeight:1 }}>›</motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ═══════════════════════════════════════════════════════════════
   CATEGORY HERO — MEJORA A
   Fills dead space when category has < HERO_THRESHOLD items.
═══════════════════════════════════════════════════════════════ */
const HERO_THRESHOLD = 5;

const CategoryHero = ({ meta, restaurantName }) => (
  <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15, duration:0.5 }}
    style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-evenly', paddingTop:8, paddingBottom:12, minHeight:0 }}>
    <motion.div animate={{ y:[0,-8,0] }} transition={{ duration:3.5, repeat:Infinity, ease:'easeInOut' }}
      style={{ width:120, height:120, borderRadius:36, background:`${meta.accent}16`, border:`1.5px solid ${meta.accent}28`,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:60, boxShadow:`0 20px 60px ${meta.accent}22, 0 0 0 1px ${meta.accent}10` }}>
      {meta.icon}
    </motion.div>
    <div style={{ display:'flex', alignItems:'center', gap:8, width:'60%' }}>
      <div style={{ flex:1, height:1, background:`${meta.accent}20` }} />
      <span style={{ fontSize:14, opacity:0.3 }}>{meta.icon}</span>
      <div style={{ flex:1, height:1, background:`${meta.accent}20` }} />
    </div>
    <p style={{ fontSize:12, fontWeight:300, color:'rgba(30,20,8,0.38)', fontStyle:'italic', lineHeight:1.55, textAlign:'center', maxWidth:'70%', margin:0 }}>
      Nuestra selección de{' '}
      <span style={{ fontWeight:600, color:`${meta.accent}cc` }}>{meta.label?.toLowerCase() || 'productos'}</span>
    </p>
    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
      {[0,1,2].map(i => (
        <motion.div key={i} animate={{ opacity:[0.15,0.6,0.15], scale:[1,1.15,1] }} transition={{ duration:1.8, repeat:Infinity, delay:i*0.28 }}
          style={{ width:i===1?18:6, height:6, borderRadius:3, background:meta.accent }} />
      ))}
    </div>
    {restaurantName && (
      <p style={{ fontSize:8, fontWeight:900, letterSpacing:'0.4em', textTransform:'uppercase', color:'rgba(30,20,8,0.14)', margin:0 }}>
        {restaurantName}
      </p>
    )}
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════
   LOADING SKELETON — dark theme
═══════════════════════════════════════════════════════════════ */
const LoadingSkeleton = () => (
  <div className="w-full h-full flex items-center justify-center" style={{ background: '#080604' }}>
    <div className="w-full max-w-[280px] px-6 space-y-3 animate-pulse">
      <div className="h-3 w-20 rounded-lg" style={{ background: 'rgba(245,180,80,0.12)' }} />
      <div className="h-9 w-44 rounded-lg" style={{ background: 'rgba(245,180,80,0.08)' }} />
      <div className="h-[2px] w-10 rounded-full" style={{ background: 'rgba(184,120,32,0.3)' }} />
      <div className="space-y-2 mt-5">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-[46px] rounded-2xl w-full"
            style={{ background: 'rgba(253,248,239,0.04)', border: '0.5px solid rgba(184,120,32,0.08)' }} />
        ))}
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   NAV ARROW — CSS opacity/pointerEvents instead of mount/unmount.
   Fixes ‹ button not responding during AnimatePresence transitions.
═══════════════════════════════════════════════════════════════ */
const NavArrow = ({ direction, visible, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: 30, height: 30, borderRadius: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(253,248,239,0.07)',
      border: '0.5px solid rgba(184,120,32,0.2)',
      flexShrink: 0,
      cursor: visible ? 'pointer' : 'default',
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? 'auto' : 'none',
      transition: 'opacity 0.2s ease',
    }}
  >
    <span style={{
      color: 'rgba(253,248,239,0.55)', fontSize: 16,
      fontWeight: 700, lineHeight: 1, userSelect: 'none',
    }}>
      {direction === 'prev' ? '‹' : '›'}
    </span>
  </button>
);

/* ─────────────────────────────────────────────
   COMPACT PRODUCT ROW  (fits 5–10 per page)
───────────────────────────────────────────── */
const CompactProductRow = ({ item, accent, onAdd, onClick }) => (
  <motion.div
    initial={{ opacity: 0, x: -6 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
    style={{
      background: 'rgba(255,255,255,0.52)',
      border: '0.5px solid rgba(184,120,32,0.14)',
      minHeight: 46,
    }}
    onClick={onClick}
  >
    <div
      className="absolute left-0 top-[22%] bottom-[22%] w-[2px] rounded-r-full"
      style={{ background: `linear-gradient(to bottom, transparent, ${accent}80, transparent)` }}
    />
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
      style={{ background: `${accent}12` }}
    >
      {item.image_url
        ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        : <span style={{ fontSize: 15 }}>🍽️</span>
      }
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-tight leading-tight truncate" style={{ color: '#1a1008' }}>
        {item.name}
      </p>
      {item.description && (
        <p className="text-[8.5px] font-light leading-tight truncate mt-[1px]" style={{ color: 'rgba(30,20,8,0.42)' }}>
          {item.description}
        </p>
      )}
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="text-[12px] font-black" style={{ color: '#1a1008', fontVariantNumeric: 'tabular-nums' }}>
        {item.price}
      </span>
      <button
        className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center active:scale-90 transition-transform"
        style={{ background: '#1a1008' }}
        onClick={e => { e.stopPropagation(); onAdd(); }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 2v6M2 5h6" stroke="#f7e8b0" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  </motion.div>
);

/* ─────────────────────────────────────────────
   MAIN ENGINE
───────────────────────────────────────────── */
export const MenuEngine = ({ config }) => {
  const { addToCart } = useCart();
  const { width: vpWidth, height: vpHeight } = useViewport916();

  const [allMenuData, setAllMenuData] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showEventWizard, setShowEventWizard] = useState(false);
  const [showPeel, setShowPeel]             = useState(false);
  const [hasInteracted, setHasInteracted]   = useState(false);

  const bookRef  = useRef(null);
  const pflip    = useRef(null);
  const peelTimer = useRef(null);
  const currentPageRef = useRef(0);

  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

  /* ── CORNER PEEL timer — MEJORA B ── */
  useEffect(() => {
    if (hasInteracted || !allMenuData) return;
    peelTimer.current = setTimeout(() => setShowPeel(true), 2500);
    return () => clearTimeout(peelTimer.current);
  }, [hasInteracted, allMenuData]);

  const handleInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      setShowPeel(false);
      clearTimeout(peelTimer.current);
    }
  };

  /* ── FETCH MENU ── */
  useEffect(() => {
    const tenantSlug = config?.slug || 'la-rivera';
    (async () => {
      try {
        const [menuRes, catsRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/tenant/${tenantSlug}/menu`, { signal: AbortSignal.timeout(4000) }),
          fetch(`${API_URL}/api/v1/tenant/${tenantSlug}/categories`, { signal: AbortSignal.timeout(4000) }),
        ]);
        if (!menuRes.ok) throw new Error(`HTTP ${menuRes.status}`);
        const data = await menuRes.json();
        const catsData = await catsRes.json().catch(() => []);

        const FALLBACK_ACCENTS = ['#10b981', '#f97316', '#f59e0b', '#06b6d4', '#ec4899'];
        catsData.forEach((c, idx) => {
          if (!CATEGORY_META[c.name]) {
            CATEGORY_META[c.name] = {
              accent: FALLBACK_ACCENTS[idx % FALLBACK_ACCENTS.length],
              icon: c.icon || '🍽️',
              label: c.name,
            };
          }
        });

        const ITEMS_PER_PAGE = 10;
        const paginated = {};
        Object.keys(data).forEach(catName => {
          const prods = data[catName];
          if (prods.length <= ITEMS_PER_PAGE) {
            paginated[catName] = prods;
          } else {
            for (let i = 0; i < prods.length; i += ITEMS_PER_PAGE) {
              const pn = Math.floor(i / ITEMS_PER_PAGE) + 1;
              const key = i === 0 ? catName : `${catName} ${pn}`;
              paginated[key] = prods.slice(i, i + ITEMS_PER_PAGE);
              if (i > 0 && CATEGORY_META[catName]) {
                CATEGORY_META[key] = {
                  ...CATEGORY_META[catName],
                  label: `${CATEGORY_META[catName].label || catName} Pt. ${pn}`,
                };
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

  /* ── INIT PAGE-FLIP using container dims, NOT window ── */
  useEffect(() => {
    if (!allMenuData || !bookRef.current || vpWidth === 0 || vpHeight === 0) return;

    const timer = setTimeout(() => {
      try {
        if (pflip.current) pflip.current.destroy();

        pflip.current = new PageFlip(bookRef.current, {
          width: vpWidth,      // ← 9:16 container width
          height: vpHeight,    // ← 9:16 container height
          size: 'stretch',
          minWidth: 280,
          maxWidth: 600,
          minHeight: 480,
          maxHeight: 1400,
          maxShadowOpacity: 0.35,
          showCover: false,
          mobileScrollSupport: false,
          usePortrait: true,
          flippingTime: 1000,
          swipeDistance: 12,
          showPageCorners: true,
          disableFlipByClick: true,
          autoSize: true,
          direction: 'rtl',
        });

        window.pflipInstance = pflip.current;
        const pages = document.querySelectorAll('.page-item');
        if (pages.length > 0) {
          pflip.current.loadFromHTML(pages);
          pflip.current.on('flip', e => {
            setCurrentPage(e.data);
            handleInteraction();
          });
        }
      } catch (e) {
        console.error('PageFlip init error:', e);
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (pflip.current) { try { pflip.current.destroy(); } catch { /* cleanup */ } }
    };
  }, [allMenuData, vpWidth, vpHeight]);

  /* ── SWIPE ── */
  useEffect(() => {
    const el = bookRef.current;
    if (!el || !allMenuData) return;
    let startX = 0, startY = 0, startTime = 0;
    const onStart = e => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    };
    const onEnd = e => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const dt = Date.now() - startTime;
      if (Math.abs(dx) > Math.abs(dy) * 1.3 && dt < 600) {
        handleInteraction();
        if (dx < -50 && pflip.current) {
          pflip.current.flipNext();
          if (navigator.vibrate) navigator.vibrate(10);
        } else if (dx > 50 && pflip.current && currentPageRef.current > 0) {
          pflip.current.flipPrev();
          if (navigator.vibrate) navigator.vibrate(10);
        }
      }
    };
    el.addEventListener('touchstart', onStart, { capture: true, passive: true });
    el.addEventListener('touchend', onEnd, { capture: true, passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart, { capture: true });
      el.removeEventListener('touchend', onEnd, { capture: true });
    };
  }, [allMenuData]);

  const categories   = allMenuData ? Object.keys(allMenuData) : [];
  const totalPages   = categories.length;
  const brandColor   = config?.brand_color || '#f59e0b';
  const restaurantName = config?.name || '';
  const isWideScreen = vpWidth > 0 && vpWidth < window.innerWidth;

  const goPrev = () => {
    if (!pflip.current || currentPageRef.current <= 0) return;
    handleInteraction();
    pflip.current.flipPrev();
    if (navigator.vibrate) navigator.vibrate(8);
  };
  const goNext = () => {
    if (!pflip.current || currentPageRef.current >= totalPages - 1) return;
    handleInteraction();
    pflip.current.flipNext();
    if (navigator.vibrate) navigator.vibrate(8);
  };

  return (
    /*
      OUTER SHELL — covers full viewport, dark background visible on
      tablet/desktop as letterbox/pillarbox framing the 9:16 column.
    */
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#040302' }}>

      {/*
        9:16 CONTAINER
        ─────────────
        Mobile portrait  → fills screen edge to edge (no visible bg)
        Tablet / Desktop → centred column with dark sides visible,
                           subtle device-frame border + shadow
      */}
      <div
        style={{
          width: vpWidth || '100%',
          height: vpHeight || '100%',
          position: 'relative',
          overflow: 'hidden',
          background: '#080604',
          borderRadius: isWideScreen ? 28 : 0,
          boxShadow: isWideScreen
            ? '0 0 0 1px rgba(184,120,32,0.1), 0 32px 80px rgba(0,0,0,0.7)'
            : 'none',
        }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[20%] -left-[15%] w-[60%] h-[60%] rounded-full"
            style={{ background: `${brandColor}0d`, filter: 'blur(80px)' }} />
          <div className="absolute -bottom-[15%] -right-[15%] w-[50%] h-[50%] rounded-full"
            style={{ background: `${brandColor}07`, filter: 'blur(70px)' }} />
        </div>

        {!allMenuData && <LoadingSkeleton />}

        {allMenuData && (
          <>
            <div className="relative w-full h-full overflow-hidden">
              <div
                ref={bookRef}
                className="w-full h-full"
                style={{
                  touchAction: 'none',
                  pointerEvents: document.body.classList.contains('checkout-open') ? 'none' : 'auto',
                }}
              >
                {categories.map((cat, pageIdx) => {
                  const items = allMenuData[cat] || [];
                  const meta = CATEGORY_META[cat] || { accent: '#f59e0b', icon: '🍽️', label: cat };
                  const isSparse  = items.length < HERO_THRESHOLD;

                  return (
                    <div key={cat} className="page-item overflow-hidden" data-density="soft">
                      <div
                        className="page-content h-full flex flex-col relative"
                        style={{
                          background: 'linear-gradient(162deg, #fdf8ef 0%, #f7f0de 55%, #f0e8d0 100%)',
                          paddingTop: 20,
                          paddingLeft: 18,
                          paddingRight: 18,
                          paddingBottom: 70,
                        }}
                      >
                        {/* Top accent */}
                        <div className="absolute top-0 left-0 right-0 h-[2px]"
                          style={{ background: `linear-gradient(to right, transparent, ${meta.accent}30, transparent)` }} />

                        {/* Spine shadow */}
                        <div className="absolute right-0 top-0 bottom-0 w-[22px] pointer-events-none z-30"
                          style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.07), transparent)' }} />

                        {/* Grain */}
                        <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-[0.015]"
                          style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }} />

                        {/* MEJORA D — Watermark hidden when hero is showing */}
                        {!isSparse && (
                          <div
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            style={{ zIndex: 1 }}
                          >
                            <span style={{
                              fontSize:   Math.min(vpWidth * 0.55, 220),
                              opacity:    0.028,
                              lineHeight: 1,
                              userSelect: 'none',
                            }}>
                              {meta.icon}
                            </span>
                          </div>
                        )}

                        {/* Header */}
                        <div className="mb-3 relative z-20 pl-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <motion.div
                              initial={{ x: -14, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              className="flex items-center gap-2"
                            >
                              <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center"
                                style={{
                                  background: `${meta.accent}15`,
                                  border:     `0.5px solid ${meta.accent}30`,
                                }}
                              >
                                <span style={{ fontSize: 13 }}>{meta.icon}</span>
                              </div>
                            </motion.div>
                            <span className="font-mono text-[10px] italic"
                              style={{ color: 'rgba(30,20,8,0.2)' }}>
                              {String(pageIdx + 1).padStart(2, '0')}&thinsp;/&thinsp;{String(totalPages).padStart(2, '0')}
                            </span>
                          </div>
                          <h2 className="text-[26px] font-black uppercase italic tracking-tighter leading-[0.85] break-words mb-2"
                            style={{ color: '#1a1008' }}>
                            {cat}
                          </h2>
                          <motion.div initial={{ width: 0 }} animate={{ width: 36 }}
                            className="h-[2px] rounded-full" style={{ backgroundColor: meta.accent, opacity: 0.55 }} />
                        </div>

                        {/* Products */}
                        <div
                          className="flex flex-col gap-[5px] overflow-y-auto relative z-20"
                          style={{
                            scrollbarWidth: 'none',
                            flex: isSparse ? '0 0 auto' : '1 1 auto',
                          }}
                        >
                          {items.map(item => (
                            <CompactProductRow
                              key={item.id}
                              item={item}
                              accent={meta.accent}
                              onAdd={() => { addToCart(item); handleInteraction(); }}
                              onClick={() => { setSelectedProduct(item); handleInteraction(); }}
                            />
                          ))}
                        </div>

                        {/* MEJORA A — CategoryHero fills dead space */}
                        {isSparse && (
                          <CategoryHero meta={meta} restaurantName={restaurantName} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* MEJORA B — Corner peel */}
              <CornerPeel
                visible={showPeel && currentPage < totalPages - 1}
                accent={brandColor}
              />
            </div>

            {/* MEJORA C — Unified bottom bar with arrows inside */}
            <div
              className="absolute bottom-0 left-0 right-0 z-[200] flex items-center px-3 gap-2"
              style={{
                height:              62,
                background:          'rgba(8,6,4,0.88)',
                backdropFilter:      'blur(18px)',
                WebkitBackdropFilter:'blur(18px)',
                borderTop:           '0.5px solid rgba(184,120,32,0.12)',
              }}
            >
              <motion.button
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, type: 'spring', stiffness: 200, damping: 20 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => { setShowEventWizard(true); handleInteraction(); }}
                className="flex items-center gap-1.5 rounded-2xl px-3 py-2 flex-shrink-0"
                style={{
                  background: 'rgba(253,248,239,0.08)',
                  border:     '0.5px solid rgba(245,158,11,0.3)',
                  boxShadow:  '0 4px 20px rgba(245,158,11,0.1)',
                }}
              >
                <span style={{ fontSize: 15, lineHeight: 1 }}>🎉</span>
                <span className="text-[8px] font-black uppercase tracking-[0.2em]"
                  style={{ color: '#f59e0b' }}>
                  Evento
                </span>
              </motion.button>

              {/* ‹ — always mounted, CSS show/hide */}
              <NavArrow direction="prev" visible={currentPage > 0} onClick={goPrev} />

              {/* Page dots */}
              <div className="flex-1 flex items-center justify-center gap-1.5 overflow-hidden px-1">
                {categories.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ width: i === currentPage ? 16 : 5, opacity: i === currentPage ? 1 : 0.25 }}
                    transition={{ duration: 0.25 }}
                    style={{ height: 5, borderRadius: 3, background: brandColor, flexShrink: 0 }}
                  />
                ))}
              </div>

              {/* › — always mounted, CSS show/hide */}
              <NavArrow direction="next" visible={currentPage < totalPages - 1} onClick={goNext} />
            </div>
          </>
        )}

        {/* Event Wizard */}
        <AnimatePresence>
          {showEventWizard && (
            <EventWizard slug={config?.slug || 'la-rivera'} onClose={() => setShowEventWizard(false)} />
          )}
        </AnimatePresence>

        {/* Product modal */}
        <AnimatePresence>
          {selectedProduct && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[300] flex items-center justify-center p-6"
              style={{ background: 'rgba(8,6,4,0.78)', backdropFilter: 'blur(20px)' }}
              onClick={() => setSelectedProduct(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 50, rotateX: 15 }}
                animate={{ scale: 1, y: 0, rotateX: 0 }}
                exit={{ scale: 0.8, y: 50, opacity: 0 }}
                className="w-full max-w-sm overflow-hidden"
                style={{
                  background: 'linear-gradient(162deg, #fdf8ef 0%, #f7f0de 100%)',
                  borderRadius: '3.5rem',
                  border: '0.5px solid rgba(184,120,32,0.2)',
                  boxShadow: '0 50px 100px rgba(0,0,0,0.5)',
                }}
                onClick={e => e.stopPropagation()}
              >
                <div className="relative aspect-square">
                  <img
                    src={selectedProduct.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
                    className="w-full h-full object-cover" alt={selectedProduct.name}
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #f7f0de, transparent 60%)' }} />
                  <button onClick={() => setSelectedProduct(null)}
                    className="absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(253,248,239,0.7)', backdropFilter: 'blur(12px)', border: '0.5px solid rgba(184,120,32,0.2)', color: '#1a1008' }}>
                    ✕
                  </button>
                </div>
                <div className="px-10 pb-12 -mt-12 relative z-10 text-center">
                  <div className="inline-block px-4 py-1.5 rounded-full mb-4"
                    style={{ background: 'rgba(245,158,11,0.1)', border: '0.5px solid rgba(245,158,11,0.25)' }}>
                    <span className="text-[9px] font-black uppercase tracking-[0.4em]" style={{ color: '#b87820' }}>Chef Selection</span>
                  </div>
                  <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-[0.8] mb-4" style={{ color: '#1a1008' }}>
                    {selectedProduct.name}
                  </h3>
                  <p className="text-xs italic font-light leading-relaxed mb-10" style={{ color: 'rgba(30,20,8,0.4)' }}>
                    {selectedProduct.description || 'Una experiencia gourmet diseñada para elevar tus sentidos.'}
                  </p>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm" style={{ color: 'rgba(30,20,8,0.3)' }}>$</span>
                      <span className="text-4xl font-black" style={{ color: '#1a1008' }}>{selectedProduct.price}</span>
                    </div>
                    <button
                      onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                      className="w-full py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] active:scale-95 transition-all tactile-button"
                      style={{ color: '#1a1008' }}>
                      ✦ Añadir a la Orden
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Letterbox label */}
      {isWideScreen && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none" style={{ opacity: 0.22 }}>
          <span className="text-[9px] font-black uppercase tracking-[0.35em]" style={{ color: '#f59e0b' }}>
            {restaurantName || 'Lacarta'} · Menu
          </span>
        </div>
      )}
    </div>
  );
};
