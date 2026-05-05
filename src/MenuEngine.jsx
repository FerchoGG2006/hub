/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageFlip } from 'page-flip';
import { MENU_DATA as STATIC_MENU, CATEGORY_META } from './MenuData';
import { useCart } from './useCart';
import { EventWizard } from './EventWizard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
import { useViewport916 } from './useViewport916';

// ───── Corner Peel (sin cambios) ─────
const CornerPeel = ({ visible, accent }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'absolute', bottom: 70, right: 0,
          width: 52, height: 52,
          pointerEvents: 'none', zIndex: 50,
        }}
      >
        <motion.div
          animate={{ opacity: [0.18, 0.35, 0.18] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 44, height: 44,
            background: 'radial-gradient(ellipse at 100% 100%, rgba(0,0,0,0.28) 0%, transparent 70%)',
            borderRadius: '0 0 0 100%',
          }}
        />
        <motion.div
          animate={{ width: [28, 38, 28], height: [28, 38, 28] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 28, height: 28,
            background: `linear-gradient(135deg, ${accent}30 0%, #f0e8d0 60%, #e8dcc0 100%)`,
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
            borderLeft: '0.5px solid rgba(184,120,32,0.2)',
            borderTop: '0.5px solid rgba(184,120,32,0.15)',
          }}
        />
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', bottom: 5, right: 5,
            fontSize: 9, color: accent, fontWeight: 900, lineHeight: 1,
          }}
        >›</motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ───── Category Hero (sin cambios) ─────
const HERO_THRESHOLD = 5;

const CategoryHero = ({ meta, restaurantName }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.15, duration: 0.5 }}
    style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-evenly',
      paddingTop: 8,
      paddingBottom: 12,
      minHeight: 0,
    }}
  >
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width: 120, height: 120, borderRadius: 36,
        background: `${meta.accent}16`,
        border: `1.5px solid ${meta.accent}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 60,
        boxShadow: `0 20px 60px ${meta.accent}22, 0 0 0 1px ${meta.accent}10`,
      }}
    >
      {meta.icon}
    </motion.div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '60%' }}>
      <div style={{ flex: 1, height: 1, background: `${meta.accent}20` }} />
      <span style={{ fontSize: 14, opacity: 0.3 }}>{meta.icon}</span>
      <div style={{ flex: 1, height: 1, background: `${meta.accent}20` }} />
    </div>

    <p style={{
      fontSize: 12, fontWeight: 300,
      color: 'rgba(30,20,8,0.38)', fontStyle: 'italic',
      lineHeight: 1.55, textAlign: 'center',
      maxWidth: '70%', margin: 0,
    }}>
      {'Nuestra selección de '}
      <span style={{ fontWeight: 600, color: `${meta.accent}cc` }}>
        {meta.label?.toLowerCase() || 'productos'}
      </span>
    </p>

    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          animate={{ opacity: [0.15, 0.6, 0.15], scale: [1, 1.15, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.28 }}
          style={{
            width: i === 1 ? 18 : 6, height: 6, borderRadius: 3,
            background: meta.accent,
          }}
        />
      ))}
    </div>

    {restaurantName && (
      <p style={{
        fontSize: 8, fontWeight: 900,
        letterSpacing: '0.4em', textTransform: 'uppercase',
        color: 'rgba(30,20,8,0.14)', margin: 0,
      }}>
        {restaurantName}
      </p>
    )}
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════
//  NAV ARROW — z-index alto, fuera del flujo de page-flip
// ═══════════════════════════════════════════════════════════════
const NavArrow = ({ direction, visible, onClick }) => (
  <button
    onPointerDown={(e) => {
      e.stopPropagation();
      if (visible) onClick();
    }}
    style={{
      width: 44,
      height: 44,
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: visible ? 'rgba(253,248,239,0.85)' : 'rgba(253,248,239,0.2)',
      border: `0.5px solid rgba(197,160,89,${visible ? 0.3 : 0.1})`,
      flexShrink: 0,
      cursor: visible ? 'pointer' : 'default',
      opacity: visible ? 1 : 0.3,
      pointerEvents: 'auto',
      transition: 'all 0.2s ease',
      boxShadow: visible ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
      position: 'relative',
      zIndex: 999,
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
    }}
    aria-label={direction === 'prev' ? 'Anterior' : 'Siguiente'}
  >
    <span style={{
      color: visible ? '#1a1008' : 'rgba(30,20,8,0.3)',
      fontSize: 22,
      fontWeight: 800,
      lineHeight: 1,
      userSelect: 'none',
      pointerEvents: 'none',
    }}>
      {direction === 'prev' ? '‹' : '›'}
    </span>
  </button>
);

// ───── Formateador de precio (sin cambios) ─────
const formatPrice = (price) => {
  if (typeof price === 'number') return price.toLocaleString('es-CO');
  // Already a formatted string — return as-is
  return String(price);
};

// ───── Skeleton (sin cambios) ─────
const LoadingSkeleton = () => (
  <div className="w-full h-full flex items-center justify-center" style={{ background: '#080604' }}>
    <div className="w-full max-w-[280px] px-6 space-y-3 animate-pulse">
      <div className="h-3 w-20 rounded-lg" style={{ background: 'rgba(245,180,80,0.12)' }} />
      <div className="h-9 w-44 rounded-lg" style={{ background: 'rgba(245,180,80,0.08)' }} />
      <div className="h-[2px] w-10 rounded-full" style={{ background: 'rgba(184,120,32,0.3)' }} />
      <div className="space-y-2 mt-5">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-[46px] rounded-2xl w-full"
            style={{ background:'rgba(253,248,239,0.04)', border:'0.5px solid rgba(184,120,32,0.08)' }} />
        ))}
      </div>
    </div>
  </div>
);

// ───── CompactProductRow (sin cambios) ─────
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
    {/* Left accent stripe */}
    <div className="absolute left-0 top-[20%] bottom-[20%] w-[2px] rounded-r-full"
      style={{ background:`linear-gradient(to bottom, transparent, ${accent}80, transparent)` }} />

    {/* Thumbnail */}
    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
      style={{ background:`${accent}12` }}>
      {item.image_url
        ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        : <span style={{ fontSize: 17 }}>{item.icon || '🍽️'}</span>
      }
    </div>

    {/* Name + description */}
    <div className="flex-1 min-w-0">
      <p className="text-[11.5px] font-bold uppercase tracking-tight leading-tight truncate"
        style={{ color: '#1a1008' }}>
        {item.name}
      </p>
      {item.description && (
        <p className="text-[8.5px] font-light leading-tight truncate mt-[1px]"
          style={{ color: 'rgba(30,20,8,0.42)' }}>
          {item.description}
        </p>
      )}
    </div>

    {/* Price — $ separated explicitly */}
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="text-[12px] font-black"
        style={{ color: '#1a1008', fontVariantNumeric: 'tabular-nums' }}>
        {'$'}{formatPrice(item.price)}
      </span>
      <button
        className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center active:scale-90 transition-transform relative z-50"
        style={{ background: '#1a1008', touchAction: 'manipulation' }}
        onPointerDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        onPointerUp={e => { e.stopPropagation(); e.preventDefault(); onAdd(); }}
        onClick={e => { e.stopPropagation(); e.preventDefault(); onAdd(); }}
      >
        <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
          <path d="M5 2v6M2 5h6" stroke="#f7e8b0" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════
//  MAIN ENGINE – REESCRITO PARA FIABILIDAD TOTAL
// ═══════════════════════════════════════════════════════════════
export const MenuEngine = ({ config }) => {
  const { addToCart } = useCart();
  const { width: vpWidth, height: vpHeight } = useViewport916();

  const [allMenuData, setAllMenuData]         = useState(null);
  const [currentPage, setCurrentPage]         = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showEventWizard, setShowEventWizard] = useState(false);
  const [showPeel, setShowPeel]               = useState(false);
  const [hasInteracted, setHasInteracted]     = useState(false);

  const bookRef        = useRef(null);
  const pflip          = useRef(null);
  const peelTimer      = useRef(null);
  const currentPageRef = useRef(0);
  const totalPagesRef  = useRef(0);
  const isInitialized  = useRef(false); // ✅ Bandera para controlar init único
  const scrollContainerRef = useRef(null);
  const isFlippingRef  = useRef(false);

  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

  /* Corner peel */
  useEffect(() => {
    if (hasInteracted || !allMenuData) return;
    peelTimer.current = setTimeout(() => setShowPeel(true), 2500);
    return () => clearTimeout(peelTimer.current);
  }, [hasInteracted, allMenuData]);

  const hasInteractedRef = useRef(false);
  useEffect(() => { hasInteractedRef.current = hasInteracted; }, [hasInteracted]);

  const handleInteraction = useCallback(() => {
    if (!hasInteractedRef.current) {
      setHasInteracted(true);
      setShowPeel(false);
      clearTimeout(peelTimer.current);
    }
  }, []);

  /* ── Fetch menú ─────────────────────────────────────────── */
  useEffect(() => {
    const tenantSlug = config?.slug || 'la-rivera';
    (async () => {
      try {
        const [menuRes, catsRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/tenant/${tenantSlug}/menu`,       { signal: AbortSignal.timeout(4000) }),
          fetch(`${API_URL}/api/v1/tenant/${tenantSlug}/categories`, { signal: AbortSignal.timeout(4000) }),
        ]);
        if (!menuRes.ok) throw new Error(`HTTP ${menuRes.status}`);
        const data     = await menuRes.json();
        const catsData = await catsRes.json().catch(() => []);

        const FALLBACK_ACCENTS = ['#10b981','#f97316','#f59e0b','#06b6d4','#ec4899'];
        catsData.forEach((c, idx) => {
          if (!CATEGORY_META[c.name]) {
            CATEGORY_META[c.name] = {
              accent: FALLBACK_ACCENTS[idx % FALLBACK_ACCENTS.length],
              icon: c.icon || '🍽️', label: c.name,
            };
          }
        });

        const ITEMS_PER_PAGE = 10;
        const paginated = {};
        Object.keys(data).forEach(catName => {
          const prods = data[catName];
          if (prods.length <= ITEMS_PER_PAGE) paginated[catName] = prods;
          else {
            for (let i = 0; i < prods.length; i += ITEMS_PER_PAGE) {
              const pn  = Math.floor(i / ITEMS_PER_PAGE) + 1;
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
        totalPagesRef.current = Object.keys(paginated).length;
        setAllMenuData(paginated);
      } catch {
        setAllMenuData(STATIC_MENU);
      }
    })();
  }, [config?.slug]);

  /* ── Inicialización de PageFlip (SOLO UNA VEZ) ──────────── */
  useEffect(() => {
    if (!allMenuData || !bookRef.current || isInitialized.current) return;
    const timer = setTimeout(() => {
      try {
        if (pflip.current) pflip.current.destroy();

        pflip.current = new PageFlip(bookRef.current, {
          width: 360, height: 640,
          size: 'stretch',
          minWidth: 280, maxWidth: 600,
          minHeight: 480, maxHeight: 1400,
          maxShadowOpacity: 0.4,
          showCover: false,
          mobileScrollSupport: false,
          usePortrait: true,
          flippingTime: 700,
          swipeDistance: 0, // Disable internal swipe
          showPageCorners: false,
          disableFlipByClick: true,
          useMouseEvents: false, // Disable all internal touch/mouse
          autoSize: true,
          clickEventForward: false,
        });

        const pages = document.querySelectorAll('.page-item');
        if (pages.length > 0) {
          pflip.current.loadFromHTML(pages);
          pflip.current.on('flip', (e) => {
            setCurrentPage(e.data);
            currentPageRef.current = e.data;
            handleInteraction();
            isFlippingRef.current = false;
          });
          pflip.current.on('changeState', (e) => {
            if (e.data === 'flipping' || e.data === 'user_fold' || e.data === 'folding') {
              isFlippingRef.current = true;
            } else if (e.data === 'read') {
              isFlippingRef.current = false;
            }
          });
          isInitialized.current = true;
        }
      } catch (e) {
        console.error('PageFlip init error:', e);
      }
    }, 300); // ✅ Reducido a 300ms para mejor respuesta

    return () => {
      clearTimeout(timer);
      // ✅ NO destruimos aquí; lo hacemos solo al desmontar abajo
    };
  }, [allMenuData, handleInteraction]); // ✅ Solo depende de los datos y callbacks, no de viewport

  // Destrucción al desmontar
  useEffect(() => {
    return () => {
      if (pflip.current) {
        try { pflip.current.destroy(); } catch (e) { /* ignore */ }
        pflip.current = null;
        isInitialized.current = false;
      }
    };
  }, []);

  /* ── Actualizar tamaño de PageFlip en resize ────────────── */
  useEffect(() => {
    if (!pflip.current || !isInitialized.current) return;
    pflip.current.update();
  }, [vpWidth, vpHeight]);

  /* ── Swipe (sin cambios) ────────────────────────────────── */
  useEffect(() => {
    const el = document.getElementById('menu-main-container'); // ✅ Usamos el contenedor principal
    if (!el || !allMenuData) return;
    let startX = 0, startY = 0, startTime = 0;

    const onStart = (e) => {
      // Permitimos iniciar el gesto incluso si está 'flipping' para no ignorar inputs rápidos
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
    };

    const onEnd = (e) => {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      const dt = Date.now() - startTime;

      // Umbrales de swipe profesional: 50px de distancia, < 350ms de duración
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.1 && dt < 350) {
        if (isFlippingRef.current) return; // Si ya hay una animación en curso, esperamos
        
        handleInteraction();
        if (dx < 0 && pflip.current) {
          // Swipe IZQUIERDA -> Siguiente
          if (currentPageRef.current < totalPagesRef.current - 1) {
            try { 
              pflip.current.flipNext('top'); 
            } catch (_) { 
              pflip.current.turnToPage(currentPageRef.current + 1); 
            }
            if (navigator.vibrate) navigator.vibrate(12);
          }
        } else if (dx > 0 && pflip.current) {
          // Swipe DERECHA -> Anterior
          if (currentPageRef.current > 0) {
            try { 
              pflip.current.flipPrev('top'); 
            } catch (_) { 
              pflip.current.turnToPage(currentPageRef.current - 1); 
            }
            if (navigator.vibrate) navigator.vibrate(12);
          }
        }
      }
    };

    el.addEventListener('touchstart', onStart, { capture: true, passive: true });
    el.addEventListener('touchend', onEnd, { capture: true, passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart, { capture: true });
      el.removeEventListener('touchend', onEnd, { capture: true });
    };
  }, [allMenuData, handleInteraction]);

  /* ── Navigation handlers — turnToPage es 100% fiable ──── */
  const goPrev = useCallback(() => {
    handleInteraction();
    if (!pflip.current || currentPage <= 0) return;
    try { 
      pflip.current.update();
      pflip.current.flipPrev('top'); 
    } catch (e) {
      pflip.current.turnToPage(currentPage - 1);
    }
    if (navigator.vibrate) navigator.vibrate(8);
  }, [handleInteraction, currentPage]);

  const goNext = useCallback(() => {
    handleInteraction();
    if (!pflip.current || currentPage >= totalPagesRef.current - 1) return;
    try { 
      pflip.current.update();
      pflip.current.flipNext('top'); 
    } catch (e) {
      pflip.current.turnToPage(currentPage + 1);
    }
    if (navigator.vibrate) navigator.vibrate(8);
  }, [handleInteraction, currentPage]);

  const goToPage = useCallback((pageNum) => {
    // Si ya está animando, ignoramos para evitar que la página se quede pegada
    if (isFlippingRef.current || pageNum === currentPageRef.current) return;
    
    handleInteraction();
    if (!pflip.current || pageNum < 0 || pageNum >= totalPagesRef.current) return;

    try {
      // Usamos turnToPage para navegación directa por categorías (más robusto)
      pflip.current.turnToPage(pageNum);
    } catch (e) {
      console.warn("Manual turn failed, syncing state");
      setCurrentPage(pageNum);
      currentPageRef.current = pageNum;
    }
    if (navigator.vibrate) navigator.vibrate(15);
  }, [handleInteraction]);

  const categories     = allMenuData ? Object.keys(allMenuData) : [];
  const totalPages     = categories.length;
  const brandColor     = config?.brand_color || '#f59e0b';
  const restaurantName = config?.name || '';
  const isWideScreen   = vpWidth > 0 && vpWidth < window.innerWidth;

  /* ── Auto-scroll category bar ── */
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeBtn = container.children[currentPage];
      if (activeBtn) {
        const scrollLeft = activeBtn.offsetLeft - (container.clientWidth / 2) + (activeBtn.clientWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [currentPage]);

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#040302' }}>
      <div
        id="menu-main-container"
        style={{
          width:        vpWidth  || '100%',
          height:       vpHeight || '100%',
          position:     'relative',
          overflow:     'hidden',
          background:   '#080604',
          borderRadius: isWideScreen ? 28 : 0,
          boxShadow:    isWideScreen
            ? '0 0 0 1px rgba(184,120,32,0.1), 0 32px 80px rgba(0,0,0,0.7)'
            : 'none',
        }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div style={{ position:'absolute', top:'-20%', left:'-15%', width:'60%', height:'60%',
            borderRadius:'50%', background:`${brandColor}0d`, filter:'blur(80px)' }} />
          <div style={{ position:'absolute', bottom:'-15%', right:'-15%', width:'50%', height:'50%',
            borderRadius:'50%', background:`${brandColor}07`, filter:'blur(70px)' }} />
        </div>

        {!allMenuData && <LoadingSkeleton />}

        {allMenuData && (
          <>
            {/* Top Category Bar - Premium Floating Segmented Control */}
            {/* Top Category Bar - Premium Floating Segmented Control */}
            <div className="absolute top-4 left-0 right-0 z-[200] flex justify-center px-4 pointer-events-none">
              <div 
                ref={scrollContainerRef}
                className="flex items-center gap-1 p-1 rounded-full pointer-events-auto overflow-x-auto no-scrollbar"
                style={{
                  background: 'rgba(253, 248, 239, 0.45)', // Ivory glass
                  backdropFilter: 'blur(24px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                  border: '0.5px solid rgba(253, 248, 239, 0.6)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  maxWidth: '100%',
                  scrollBehavior: 'smooth',
                }}>
                {categories.map((cat, i) => {
                  const meta = CATEGORY_META[cat] || { icon: '🍽️', label: cat };
                  const isActive = i === currentPage;
                  return (
                    <button key={i} onPointerUp={() => goToPage(i)}
                      className="relative flex items-center justify-center px-4 py-2.5 rounded-full transition-all duration-300 ease-out active:scale-95"
                      style={{
                        touchAction: 'manipulation',
                        color: isActive ? '#1a1008' : 'rgba(30, 20, 8, 0.45)',
                        flexShrink: 0,
                        minWidth: isActive ? 100 : 48,
                      }}>
                      {isActive && (
                        <motion.div
                          layoutId="activeCategory"
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: 'linear-gradient(to right, rgb(252, 211, 77) 0%, rgb(245, 158, 11) 100%)',
                            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                          }}
                          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        />
                      )}
                      <div className="relative z-10 flex items-center gap-2">
                        <span style={{ 
                          fontSize: isActive ? 18 : 16, 
                          transition: 'all 0.3s ease',
                          filter: isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' : 'grayscale(0.5) opacity(0.7)'
                        }}>
                          {meta.icon}
                        </span>
                        <AnimatePresence mode="wait">
                          {isActive && (
                            <motion.span 
                              initial={{ width: 0, opacity: 0, x: -5 }}
                              animate={{ width: 'auto', opacity: 1, x: 0 }}
                              exit={{ width: 0, opacity: 0, x: -5 }}
                              className="text-[10px] font-black uppercase tracking-[0.1em] whitespace-nowrap overflow-hidden"
                            >
                              {meta.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative w-full h-full overflow-hidden">
              <div
                ref={bookRef}
                className="w-full h-full"
                style={{
                  touchAction:   'none',
                  pointerEvents: document.body.classList.contains('checkout-open') ? 'none' : 'auto',
                }}
              >
                {categories.map((cat, pageIdx) => {
                  const items    = allMenuData[cat] || [];
                  const meta     = CATEGORY_META[cat] || { accent:'#f59e0b', icon:'🍽️', label:cat };
                  const isSparse = items.length < HERO_THRESHOLD;

                  return (
                    <div key={cat} className="page-item overflow-hidden w-full h-full" data-density="soft">
                      <div
                        className="page-content h-full flex flex-col relative"
                        style={{
                          background:    'linear-gradient(162deg, #fdf8ef 0%, #f7f0de 55%, #f0e8d0 100%)',
                          paddingTop:    68,
                          paddingLeft:   18,
                          paddingRight:  18,
                          paddingBottom: 70,
                        }}
                      >
                        {/* Top accent */}
                        <div className="absolute top-0 left-0 right-0 h-[2px]"
                          style={{ background:`linear-gradient(to right, transparent, ${meta.accent}30, transparent)` }} />

                        {/* Spine shadow */}
                        <div className="absolute right-0 top-0 bottom-0 w-[22px] pointer-events-none z-30"
                          style={{ background:'linear-gradient(to left, rgba(0,0,0,0.07), transparent)' }} />

                        {/* Paper grain */}
                        <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-[0.015]"
                          style={{ backgroundImage:'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }} />

                        {/* MEJORA D — watermark only when NOT sparse */}
                        {!isSparse && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            style={{ zIndex: 1 }}>
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
                            <motion.div initial={{ x:-14, opacity:0 }} animate={{ x:0, opacity:1 }}
                              className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                                style={{ background:`${meta.accent}15`, border:`0.5px solid ${meta.accent}30` }}>
                                <span style={{ fontSize:13 }}>{meta.icon}</span>
                              </div>
                            </motion.div>
                            <span className="font-mono text-[10px] italic"
                              style={{ color:'rgba(30,20,8,0.2)' }}>
                              {String(pageIdx + 1).padStart(2,'0')}
                              {'\u2009/\u2009'}
                              {String(totalPages).padStart(2,'0')}
                            </span>
                          </div>
                          <h2 className="text-[26px] font-black uppercase italic tracking-tighter leading-[0.85] break-words mb-2"
                            style={{ color:'#1a1008' }}>
                            {cat}
                          </h2>
                          <motion.div initial={{ width:0 }} animate={{ width:36 }}
                            className="h-[2px] rounded-full"
                            style={{ backgroundColor:meta.accent, opacity:0.55 }} />
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

                        {/* MEJORA A — Hero */}
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

            {/* ── BOTTOM BAR ── */}
            <div
              className="absolute bottom-0 left-0 right-0 flex items-center px-3 gap-2"
              style={{
                height: 62,
                background: 'rgba(253, 248, 239, 0.45)', // Ivory glass
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                borderTop: '0.5px solid rgba(253, 248, 239, 0.6)',
                boxShadow: '0 -8px 32px rgba(0,0,0,0.1)',
                zIndex: 300,
                pointerEvents: 'auto',
              }}
            >
              {/* Evento */}
              <button
                onPointerUp={() => { setShowEventWizard(true); handleInteraction(); }}
                className="flex items-center gap-1.5 rounded-full px-4 py-2 flex-shrink-0 active:scale-95 transition-all"
                style={{
                  background: 'linear-gradient(to right, rgb(252, 211, 77) 0%, rgb(245, 158, 11) 100%)',
                  border: '0.5px solid rgba(245, 158, 11, 0.4)',
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                  touchAction: 'manipulation',
                }}
              >
                <span style={{ fontSize: 13, lineHeight: 1 }}>🎉</span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em]"
                  style={{ color: '#1a1008' }}>Evento</span>
              </button>

              {/* ‹ Prev */}
              <NavArrow direction="prev" visible={currentPage > 0} onClick={goPrev} />

              {/* Dots — clickeables para saltar a categoría */}
              <div className="flex-1 flex items-center justify-center gap-1.5 overflow-hidden px-1">
                {categories.map((_, i) => (
                  <div key={i}
                    onPointerUp={() => goToPage(i)}
                    style={{
                      width: i === currentPage ? 16 : 5,
                      height: 5,
                      borderRadius: 3,
                      background: brandColor,
                      opacity: i === currentPage ? 1 : 0.25,
                      flexShrink: 0,
                      transition: 'all 0.25s ease',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                    }}
                  />
                ))}
              </div>

              {/* › Next */}
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

        {/* Product Modal */}
        <AnimatePresence>
          {selectedProduct && (
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="absolute inset-0 z-[300] flex items-center justify-center p-6"
              style={{ background:'rgba(8,6,4,0.78)', backdropFilter:'blur(20px)' }}
              onClick={() => setSelectedProduct(null)}
            >
              <motion.div
                initial={{ scale:0.9, y:50, rotateX:15 }}
                animate={{ scale:1, y:0, rotateX:0 }}
                exit={{ scale:0.8, y:50, opacity:0 }}
                className="w-full max-w-sm overflow-hidden"
                style={{
                  background:'linear-gradient(162deg, #fdf8ef 0%, #f7f0de 100%)',
                  borderRadius:'3.5rem',
                  border:'0.5px solid rgba(184,120,32,0.2)',
                  boxShadow:'0 50px 100px rgba(0,0,0,0.5)',
                }}
                onClick={e => e.stopPropagation()}
              >
                <div className="relative aspect-square">
                  <img
                    src={selectedProduct.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
                    className="w-full h-full object-cover" alt={selectedProduct.name}
                  />
                  <div className="absolute inset-0"
                    style={{ background:'linear-gradient(to top, #f7f0de, transparent 60%)' }} />
                  <button onClick={() => setSelectedProduct(null)}
                    className="absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background:'rgba(253,248,239,0.7)', backdropFilter:'blur(12px)',
                      border:'0.5px solid rgba(184,120,32,0.2)', color:'#1a1008' }}>
                    ✕
                  </button>
                </div>
                <div className="px-10 pb-12 -mt-12 relative z-10 text-center">
                  <div className="inline-block px-4 py-1.5 rounded-full mb-4"
                    style={{ background:'rgba(245,158,11,0.1)', border:'0.5px solid rgba(245,158,11,0.25)' }}>
                    <span className="text-[9px] font-black uppercase tracking-[0.4em]" style={{ color:'#b87820' }}>
                      Chef Selection
                    </span>
                  </div>
                  <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-[0.8] mb-4"
                    style={{ color:'#1a1008' }}>{selectedProduct.name}</h3>
                  <p className="text-xs italic font-light leading-relaxed mb-10"
                    style={{ color:'rgba(30,20,8,0.4)' }}>
                    {selectedProduct.description || 'Una experiencia gourmet diseñada para elevar tus sentidos.'}
                  </p>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm" style={{ color:'rgba(30,20,8,0.3)' }}>{'$'}</span>
                      <span className="text-4xl font-black" style={{ color:'#1a1008' }}>
                        {formatPrice(selectedProduct.price)}
                      </span>
                    </div>
                    <button
                      onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                      className="w-full py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] active:scale-95 transition-all tactile-button"
                      style={{ color:'#1a1008' }}>
                      ✦ Añadir a la Orden
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop letterbox label */}
      {isWideScreen && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ opacity:0.22 }}>
          <span className="text-[9px] font-black uppercase tracking-[0.35em]" style={{ color:'#f59e0b' }}>
            {restaurantName || 'Lacarta'} · Menu
          </span>
        </div>
      )}
    </div>
  );
};
