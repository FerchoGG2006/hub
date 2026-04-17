import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MENU_DATA as STATIC_MENU, CATEGORY_META } from './MenuData';
import { useCart } from './CartContext';
import { ProductCell } from './ProductCell';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/* ── Page flip variants (skewY via custom prop) ── */
const PAGE_VARIANTS = {
  initial: (dir) => ({ rotateY: dir > 0 ? 110 : -110, skewY: dir > 0 ? -12 : 12, x: dir > 0 ? 80 : -80, opacity: 0, scale: 0.92 }),
  animate: { rotateY: 0, skewY: 0, x: 0, opacity: 1, scale: 1, transition: { duration: 0.82, ease: [0.15, 0.85, 0.35, 1] } },
  exit:    (dir) => ({ rotateY: dir > 0 ? -115 : 115, skewY: dir > 0 ? 16 : -16, opacity: 0, scale: 0.82, transition: { duration: 0.65, ease: [0.4, 0, 0.6, 1] } }),
};
const FAST_VARIANTS = {
  initial: (dir) => ({ rotateY: dir > 0 ? 90 : -90, skewY: dir > 0 ? -8 : 8, opacity: 0, scale: 0.95 }),
  animate: { rotateY: 0, skewY: 0, opacity: 1, scale: 1, transition: { duration: 0.22, ease: 'easeInOut' } },
  exit:    (dir) => ({ rotateY: dir > 0 ? -90 : 90, skewY: dir > 0 ? 12 : -12, opacity: 0, scale: 0.9, transition: { duration: 0.18, ease: 'easeIn' } }),
};

/* ProductCell is imported from ./ProductCell.jsx */

/* ── Category tabs removed per design request ── */

/* ── Loading Skeleton ── */
const LoadingSkeleton = () => (
  <div className="perspective-container">
    <div className="absolute top-8 bottom-8 rounded-[2.5rem] animate-pulse glass-card flex flex-col p-5 space-y-4" style={{ left: '12px', right: '12px' }}>
      <div className="h-6 w-32 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="grid grid-cols-1 gap-2.5 mt-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 rounded-2xl w-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
        ))}
      </div>
    </div>
  </div>
);

/* ════════════════ MAIN ENGINE ════════════════ */
export const MenuEngine = ({ config }) => {
  const { addToCart } = useCart();
  const [allMenuData, setAllMenuData] = useState(null);   // null = loading
  const [apiError,    setApiError]    = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [direction,   setDirection]   = useState(1);
  const [isFlipping,  setIsFlipping]  = useState(false);
  const lock = useRef(false);

  /* ── Fetch menu from FastAPI (fallback to static if API unavailable) ── */
  useEffect(() => {
    const tenantSlug = config?.slug || 'la-rivera';
    const loadMenu = async () => {
      try {
        const [menuRes, catsRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/tenant/${tenantSlug}/menu`, { signal: AbortSignal.timeout(4000) }),
          fetch(`${API_URL}/api/v1/tenant/${tenantSlug}/categories`, { signal: AbortSignal.timeout(4000) })
        ]);
        if (!menuRes.ok) throw new Error(`HTTP ${menuRes.status}`);
        
        const data = await menuRes.json();
        const catsData = await catsRes.json().catch(() => []);
        
        // Dynamically inject any new AI categories into the metadata map
        const FALLBACK_ACCENTS = ['#10b981', '#f97316', '#f59e0b', '#06b6d4', '#ec4899'];
        catsData.forEach((c, idx) => {
          if (!CATEGORY_META[c.name]) {
            CATEGORY_META[c.name] = {
               accent: FALLBACK_ACCENTS[idx % FALLBACK_ACCENTS.length],
               icon: c.icon || '🍽️',
               label: c.name
            };
          }
        });

        // Validate that we got categories with items
        if (Object.keys(data).length === 0) throw new Error('Empty menu');

        // Automatically Paginate: Max 4 items per page (1 column list for long descriptions)
        const paginatedData = {};
        Object.keys(data).forEach(catName => {
          const prods = data[catName];
          if (prods.length <= 4) {
            paginatedData[catName] = prods;
          } else {
            for (let i = 0; i < prods.length; i += 4) {
              const partNum = Math.floor(i / 4) + 1;
              const newCatName = i === 0 ? catName : `${catName} ${partNum}`;
              paginatedData[newCatName] = prods.slice(i, i + 4);
              
              if (i > 0 && CATEGORY_META[catName]) {
                 CATEGORY_META[newCatName] = { ...CATEGORY_META[catName] };
                 CATEGORY_META[newCatName].label = `${CATEGORY_META[catName].label || catName} Pt. ${partNum}`;
              }
            }
          }
        });

        setAllMenuData(paginatedData);
      } catch (err) {
        console.warn('API not available, using static data:', err.message);
        setApiError(true);
        setAllMenuData(STATIC_MENU);
      }
    };
    loadMenu();

    /* ── WebSocket Real-Time Magic ── */
    let ws;
    try {
      const wsUrl = API_URL.replace(/^http/, 'ws') + '/ws/menu';
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === 'MENU_UPDATE') {
          // Un plato se volvió SOLD OUT (o volvió a línea)
          if (payload.event === 'PRODUCT_TOGGLE' && navigator.vibrate) {
            navigator.vibrate([20, 50, 20]); // Pequeño destello háptico en la carta
          }
          // Refetch silencioso de la carta 3D
          const currentTenantSlug = config?.slug || 'la-rivera';
          fetch(`${API_URL}/api/v1/tenant/${currentTenantSlug}/menu`)
            .then(res => res.json())
            .then(newData => {
               if (Object.keys(newData).length > 0) setAllMenuData(newData);
            })
            .catch(err => console.warn('Sync fallido:', err));
        }
      };
    } catch (e) {
      console.warn('WebSocket init failed:', e);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [config?.slug]);

  const categories = allMenuData ? Object.keys(allMenuData) : [];
  const cat        = categories[currentPage];
  const items      = allMenuData ? allMenuData[cat] || [] : [];
  
  const FALLBACK_ACCENTS = ['#10b981', '#f97316', '#f59e0b', '#06b6d4', '#ec4899'];
  const meta = cat && CATEGORY_META[cat] ? CATEGORY_META[cat] : {
    accent: FALLBACK_ACCENTS[currentPage % FALLBACK_ACCENTS.length],
    icon: '🍽️',
    label: cat || '',
  };
  const variants = isFlipping ? FAST_VARIANTS : PAGE_VARIANTS;

  const paginate = useCallback((dir) => {
    const next = currentPage + dir;
    if (next < 0 || next >= categories.length || lock.current) return;
    lock.current = true;
    setDirection(dir); setCurrentPage(next);
    setTimeout(() => { lock.current = false; }, isFlipping ? 240 : 860);
  }, [currentPage, categories.length, isFlipping]);

  const jumpToPage = useCallback(async (target) => {
    if (target === currentPage || lock.current) return;
    lock.current = true; setIsFlipping(true);
    const dir = target > currentPage ? 1 : -1;
    setDirection(dir);
    for (let i = 0; i < Math.abs(target - currentPage); i++) {
      await new Promise(r => setTimeout(r, 130));
      setCurrentPage(prev => prev + dir);
    }
    setIsFlipping(false); lock.current = false;
  }, [currentPage]);

  const handleDragEnd = useCallback((_, info) => {
    if (Math.abs(info.offset.x) < 50 || lock.current) return;
    paginate(info.offset.x < 0 ? 1 : -1);
  }, [paginate]);

  if (!allMenuData) return <LoadingSkeleton />;

  return (
    <div className="perspective-container touch-none">
      <motion.div
        animate={{ background: `radial-gradient(ellipse at 28% 45%, ${meta.accent}1a 0%, transparent 65%)` }}
        transition={{ duration: 0.7 }} className="absolute inset-0 pointer-events-none" />

      {/* API fallback badge */}
      {apiError && (
        <div className="absolute top-3 right-3 z-50 px-2 py-1 rounded-full text-[9px] uppercase tracking-widest"
          style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: 'rgba(245,158,11,0.7)' }}>
          modo offline
        </div>
      )}

      {/* Thumb tap zones */}
      <div className="absolute inset-y-0 left-0 w-12 z-[110]" onClick={() => paginate(-1)} />
      <div className="absolute inset-y-0 right-0 w-12 z-[110]" onClick={() => paginate(1)} />

      {/* Page */}
      <AnimatePresence mode="popLayout" custom={direction}>
        <motion.div
          key={currentPage} custom={direction} variants={variants}
          initial="initial" animate="animate" exit="exit"
          drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.07} onDragEnd={handleDragEnd}
          className="page-pivot glass-card absolute rounded-[2.5rem] overflow-hidden"
          style={{ left: '12px', right: '12px', top: '2rem', bottom: '2rem', transformOrigin: 'center center', boxShadow: '0px 0px 40px -10px rgba(0,0,0,0.8)' }}
        >
          <motion.div className="fold-shadow" animate={{ opacity: lock.current ? 1 : 0 }} transition={{ duration: 0.15 }} />
          <div className="spine-shadow" />

          <div className="relative z-20 flex flex-col h-full px-4 pt-5 pb-4">
            <div className="mb-3 pl-1">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{meta.icon}</span>
                  <span className="text-[10px] uppercase tracking-[0.28em] font-semibold" style={{ color: meta.accent }}>{meta.label || cat}</span>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{ background: `${meta.accent}1a`, border: `1px solid ${meta.accent}44`, color: meta.accent }}>
                  {String(currentPage + 1).padStart(2, '0')}
                </div>
              </div>
              <h2 className="text-2xl font-black uppercase leading-none tracking-tight text-white mb-2"
                style={{ fontStyle: 'italic' }}>{cat}</h2>
              <div className="mt-2 h-px" style={{ background: `linear-gradient(90deg, ${meta.accent}aa, transparent)` }} />
            </div>

            {/* 1-column product list */}
            <div className="flex-1 grid grid-cols-1 gap-3 content-start overflow-y-auto"
              style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', scrollbarWidth: 'none', paddingBottom: '4px' }}>
              {items.map((item, idx) => (
                <ProductCell key={item.id} item={item} index={idx} accent={meta.accent} onAdd={() => addToCart(item)} />
              ))}
            </div>

            {/* Progress dots */}
            <div className="mt-3 flex items-center justify-between pl-1">
              <div className="flex gap-1.5">
                {categories.map((_, i) => (
                  <motion.div key={i}
                    animate={{ width: i === currentPage ? 18 : 5, background: i === currentPage ? meta.accent : 'rgba(255,255,255,0.15)' }}
                    transition={{ duration: 0.28 }} className="h-1 rounded-full" />
                ))}
              </div>
              <p className="text-[9px] uppercase tracking-[0.45em] text-white/20">— desliza —</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
