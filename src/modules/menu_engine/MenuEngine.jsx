/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageFlip } from 'page-flip';
import { MENU_DATA as STATIC_MENU, CATEGORY_META } from './MenuData';
import { useCart } from '../../shared/hooks/useCart';
import { EventWizard } from '../marketing/EventWizard';
import { useViewport916 } from '../../shared/hooks/useViewport916';
import { useViewportMode } from './core/hooks/useViewportMode';
import { useMenuStore } from './core/store/menuStore';
import { CheckoutPanel } from './CheckoutPanel';
import { DesktopEditorialView } from './DesktopEditorialView';
import { useWebSocket } from '../../shared/hooks/useWebSocket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ── Price Formatter ──
const formatPrice = (price) => {
  if (typeof price === 'number') return price.toLocaleString('es-CO');
  if (!price) return '0';
  let str = String(price).trim();
  if (str.toLowerCase().endsWith('k')) {
    str = str.substring(0, str.length - 1) + '.000';
  }
  if (str.startsWith('$')) {
    str = str.substring(1).trim();
  }
  return str;
};

// ── Corner Peel Component (Original Mobile) ──
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



const HERO_THRESHOLD = 5;

// ── Nav Arrow Component (Original Mobile) ──
const NavArrow = ({ direction, visible, onClick }) => (
  <button
    onClick={(e) => {
      e.preventDefault();
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

// ── Compact Product Row (Original Mobile Card) ──
const CompactProductRow = React.memo(({ item, accent, onSelect }) => {
  const { addToCart } = useCart();
  const rowRef = useRef(null);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    
    const blockEvent = (e) => {
      e.stopPropagation();
    };

    el.addEventListener('pointerdown', blockEvent, { capture: true });
    el.addEventListener('pointerup', blockEvent, { capture: true });
    el.addEventListener('touchstart', blockEvent, { capture: true, passive: true });
    el.addEventListener('touchend', blockEvent, { capture: true });
    
    return () => {
      if (el) {
        el.removeEventListener('pointerdown', blockEvent);
        el.removeEventListener('pointerup', blockEvent);
        el.removeEventListener('touchstart', blockEvent);
        el.removeEventListener('touchend', blockEvent);
      }
    };
  }, []);

  return (
    <motion.div
      ref={rowRef}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      style={{
        background: 'rgba(255,255,255,0.52)',
        border: '0.5px solid rgba(184,120,32,0.14)',
        minHeight: 46,
      }}
      onClick={onSelect}
    >
      {/* Left accent stripe */}
      <div className="absolute left-0 top-[20%] bottom-[20%] w-[2px] rounded-r-full"
        style={{ background:`linear-gradient(to bottom, transparent, ${accent}80, transparent)` }} />

      {/* Thumbnail */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{ background:`${accent}12` }}>
        {item.image || item.image_url
          ? <img src={item.image || item.image_url} alt={item.name} className="w-full h-full object-cover" />
          : <span style={{ fontSize: 17 }}>{item.icon || '🍽️'}</span>
        }
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-[11.5px] font-bold uppercase tracking-tight leading-tight truncate"
          style={{ color: '#1a1008' }}>
          {item.name}
        </p>
        {(item.desc || item.description) && (
          <p className="text-[10px] font-medium leading-[1.2] mt-[3px] opacity-80"
            style={{ 
              color: '#1a1008',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
            {item.desc || item.description}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[12.5px] font-bold"
          style={{ color: '#1a1008', fontVariantNumeric: 'tabular-nums' }}>
          {'$'}{formatPrice(item.price)}
        </span>
        <button
          className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center active:scale-90 transition-transform relative z-50"
          style={{ background: '#1a1008', touchAction: 'manipulation' }}
          onClick={e => { 
            e.stopPropagation(); 
            if (item.type === 'variant' || (item.variants && item.variants.length > 0)) {
              onSelect(); 
            } else {
              addToCart(item);
            }
          }}
          onTouchEnd={e => e.stopPropagation()}
          onPointerUp={e => e.stopPropagation()}
        >
          <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
            <path d="M5 2v6M2 5h6" stroke="#f7e8b0" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
});

// Skeleton Loader
const LoadingSkeleton = () => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAF8F5] space-y-6">
    <div className="w-12 h-12 rounded-full border-t-2 border-[#B87D1A] animate-spin" />
    <span className="font-serif italic text-lg text-black/40">Cargando experiencia...</span>
  </div>
);


// ── MAIN ENGINE ──
export const MenuEngine = ({ config }) => {
  const { addToCart, cart, totalPrice } = useCart();
  const { width: vpWidth, height: vpHeight } = useViewport916();
  const { mode } = useViewportMode();

  // Zustand stores
  const zViewportMode = useMenuStore((state) => state.viewportMode);
  const zSetViewportMode = useMenuStore((state) => state.setViewportMode);

  useEffect(() => {
    zSetViewportMode(mode);
  }, [mode, zSetViewportMode]);

  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const { lastMessage } = useWebSocket(config?.id);

  useEffect(() => {
    if (lastMessage?.type === 'MENU_UPDATE') {
      setRefetchTrigger(prev => prev + 1);
    }
  }, [lastMessage]);

  const [allMenuData, setAllMenuData] = useState(null); // Complete data (for Desktop continuous scroll)
  const [paginatedMenuData, setPaginatedMenuData] = useState(null); // Paginated data (for Mobile PageFlip)
  
  const [currentPage, setCurrentPage]         = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const trackProductClick = useCallback(async (productId) => {
    try {
      const slug = config?.slug || 'la-rivera';
      await fetch(`${API_URL}/api/v1/analytics/track?product_id=${productId}&action=view&tenant_slug=${slug}`, {
        method: 'POST'
      });
    } catch (e) {
      console.warn('Analytics tracking ignored:', e.message);
    }
  }, [config?.slug]);

  const handleSelectProduct = useCallback((item) => {
    setSelectedProduct(item);
    if (item?.id) {
      trackProductClick(item.id);
    }
  }, [trackProductClick]);

  const [showEventWizard, setShowEventWizard] = useState(false);
  const [showPeel, setShowPeel]               = useState(false);
  const [hasInteracted, setHasInteracted]     = useState(false);
  const [activeCategory, setActiveCategory]   = useState('');
  const [showCartDrawer, setShowCartDrawer]   = useState(false);


  const bookRef        = useRef(null);
  const pflip          = useRef(null);
  const peelTimer      = useRef(null);
  const currentPageRef = useRef(0);
  const totalPagesRef  = useRef(0);
  const isInitialized  = useRef(false);
  const scrollContainerRef = useRef(null);
  const isFlippingRef  = useRef(false);

  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

  // Corner peel mobile timer
  useEffect(() => {
    if (hasInteracted || !paginatedMenuData) return;
    peelTimer.current = setTimeout(() => setShowPeel(true), 2500);
    return () => clearTimeout(peelTimer.current);
  }, [hasInteracted, paginatedMenuData]);

  const hasInteractedRef = useRef(false);
  useEffect(() => { hasInteractedRef.current = hasInteracted; }, [hasInteracted]);

  const handleInteraction = useCallback(() => {
    if (!hasInteractedRef.current) {
      setHasInteracted(true);
      setShowPeel(false);
      clearTimeout(peelTimer.current);
    }
  }, []);

  const isDesktop = mode === 'desktop';

  // ── Fetch menú ──
  useEffect(() => {
    const tenantSlug = config?.slug || 'la-rivera';
    (async () => {
      try {
        const [menuRes, catsRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/tenant/${tenantSlug}/menu`, { signal: AbortSignal.timeout(4000) }),
          fetch(`${API_URL}/api/v1/tenant/${tenantSlug}/categories`, { signal: AbortSignal.timeout(4000) }),
        ]);
        if (!menuRes.ok) throw new Error(`HTTP ${menuRes.status}`);
        const menuJson = await menuRes.json();
        const catsJson = await catsRes.json().catch(() => ({ data: [] }));
        const data = menuJson.data || menuJson;
        const catsData = catsJson.data || catsJson || [];

        const FALLBACK_ACCENTS = ['#10b981','#f97316','#f59e0b','#06b6d4','#ec4899'];
        catsData.forEach((c, idx) => {
          if (!CATEGORY_META[c.name]) {
            CATEGORY_META[c.name] = {
              accent: FALLBACK_ACCENTS[idx % FALLBACK_ACCENTS.length],
              icon: c.icon || '🍽️', 
              label: c.name,
            };
          }
        });

        // 1. Store unpaginated menu data for Desktop Menu
        setAllMenuData(data);
        if (Object.keys(data).length > 0) {
          setActiveCategory(Object.keys(data)[0]);
        }

        // 2. Build and store paginated menu data for Mobile PageFlip
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

        // Ensure an even number of pages for Desktop 2-page spread
        if (Object.keys(paginated).length % 2 !== 0) {
          paginated['FIN_DEL_MENU'] = [];
          CATEGORY_META['FIN_DEL_MENU'] = { accent: '#B87D1A', icon: '👋', label: 'Fin del Menú' };
        }

        totalPagesRef.current = Object.keys(paginated).length;
        setPaginatedMenuData(paginated);

      } catch (error) {
        console.error("MenuEngine fetch error:", error);
        
        const errorMenu = {
          [`ERROR: ${error.message}`]: [
            {
              id: 999,
              name: "Error",
              description: String(error.stack).substring(0, 150),
              price: "0",
              emoji: "❌",
            }
          ]
        };
        
        setAllMenuData(errorMenu);
        setActiveCategory(Object.keys(errorMenu)[0]);
        
        const pag = {
          [`ERROR: ${error.message}`]: errorMenu[`ERROR: ${error.message}`]
        };
        CATEGORY_META[`ERROR: ${error.message}`] = { accent: '#ff0000', icon: '❌', label: 'Error' };
        
        pag['FIN_DEL_MENU'] = [];
        CATEGORY_META['FIN_DEL_MENU'] = { accent: '#B87D1A', icon: '👋', label: 'Fin del Menú' };
        
        totalPagesRef.current = 2;
        setPaginatedMenuData(pag);
      }
    })();
  }, [config?.slug, refetchTrigger]);

  // ── Desktop PageFlip Setup ──
  const desktopBookRef = useRef(null);
  const desktopPflip = useRef(null);
  const desktopIsFlipping = useRef(false);

  useEffect(() => {
    if (mode === 'mobile' || !paginatedMenuData || !desktopBookRef.current) return;
    let timer;
    const initFlip = () => {
      try {
        if (desktopPflip.current) {
          desktopPflip.current.destroy();
          desktopPflip.current = null;
        }
        const pages = desktopBookRef.current.querySelectorAll('.desktop-page-item');
        if (pages.length === 0 || desktopBookRef.current.clientWidth === 0) {
          timer = setTimeout(initFlip, 150);
          return;
        }
        desktopPflip.current = new PageFlip(desktopBookRef.current, {
          width: 500, height: 700,
          size: 'stretch',
          minWidth: 250, maxWidth: 650,
          minHeight: 400, maxHeight: 900,
          maxShadowOpacity: 0.25,
          showCover: false, 
          mobileScrollSupport: false,
          usePortrait: false, 
          flippingTime: 800,
          swipeDistance: 60,
          showPageCorners: true,
          disableFlipByClick: true,
          useMouseEvents: true,
          autoSize: true,
          clickEventForward: true,
        });
        desktopPflip.current.loadFromHTML(pages);
        desktopPflip.current.on('flip', (e) => {
          setCurrentPage(e.data);
          currentPageRef.current = e.data;
          handleInteraction();
          desktopIsFlipping.current = false;
        });
        desktopPflip.current.on('changeState', (e) => {
          if (e.data === 'flipping' || e.data === 'user_fold' || e.data === 'folding') {
            desktopIsFlipping.current = true;
          } else if (e.data === 'read') {
            desktopIsFlipping.current = false;
          }
        });
      } catch (e) { console.error('Desktop PageFlip error:', e); }
    };
    timer = setTimeout(initFlip, 400);
    return () => { clearTimeout(timer); if (desktopPflip.current) desktopPflip.current.destroy(); };
  }, [mode, paginatedMenuData]);

  const desktopGoToPage = (pageNum) => {
    if (!desktopPflip.current) return;
    try {
      desktopPflip.current.turnToPage(pageNum);
      setCurrentPage(pageNum);
      currentPageRef.current = pageNum;
    } catch(e) {
      console.debug("Page turn error", e);
    }
  };

  // ─── Inicialización de PageFlip (Only on Mobile Mode) ──
  useEffect(() => {
    if (mode !== 'mobile' || !paginatedMenuData || !bookRef.current) return;
    
    let timer;
    const initFlip = () => {
      try {
        if (pflip.current) {
          pflip.current.destroy();
          pflip.current = null;
          isInitialized.current = false;
        }

        const pages = bookRef.current.querySelectorAll('.page-item');
        if (pages.length === 0) {
          timer = setTimeout(initFlip, 150);
          return;
        }

        // Safeguard to prevent collapsing when elements are not ready or dimensions are zero
        if (bookRef.current.clientWidth === 0 || bookRef.current.clientHeight === 0) {
          timer = setTimeout(initFlip, 150);
          return;
        }

        pflip.current = new PageFlip(bookRef.current, {
          width: vpWidth || 360, height: vpHeight || 640,
          size: 'stretch',
          minWidth: 280, maxWidth: 600,
          minHeight: 480, maxHeight: 1400,
          maxShadowOpacity: 0.4,
          showCover: false,
          mobileScrollSupport: false,
          usePortrait: true,
          flippingTime: 700,
          swipeDistance: 60,
          showPageCorners: false,
          disableFlipByClick: true,
          useMouseEvents: true,
          autoSize: true,
          clickEventForward: true,
        });

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
      } catch (e) {
        console.error('PageFlip init error:', e);
      }
    };

    timer = setTimeout(initFlip, 400);
    return () => {
      clearTimeout(timer);
      if (pflip.current) {
        try { pflip.current.destroy(); } catch (e) { /* ignore */ }
        pflip.current = null;
        isInitialized.current = false;
      }
    };
  }, [paginatedMenuData, mode, handleInteraction, refetchTrigger]);

  // PageFlip Destructor
  useEffect(() => {
    return () => {
      if (pflip.current) {
        try { pflip.current.destroy(); } catch (e) { /* ignore */ }
        pflip.current = null;
        isInitialized.current = false;
      }
    };
  }, []);

  // Update PageFlip layout sizes
  useEffect(() => {
    if (mode !== 'mobile' || !pflip.current || !isInitialized.current) return;
    pflip.current.update();
  }, [vpWidth, vpHeight, mode]);

  // ── Auto-scroll category bar on mobile (Vertical View) ──
  useEffect(() => {
    if (mode === 'mobile' && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const categories = Object.keys(allMenuData || {});
      const activeIdx = categories.indexOf(activeCategory);
      if (activeIdx !== -1) {
        const activeBtn = container.children[activeIdx];
        if (activeBtn) {
          const scrollLeft = activeBtn.offsetLeft - (container.clientWidth / 2) + (activeBtn.clientWidth / 2);
          container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
      }
    }
  }, [activeCategory, mode, allMenuData]);

  // ── Mobile Scroll Active Category Tracking (Vertical View) ──
  useEffect(() => {
    if (mode !== 'mobile' || !allMenuData) return;
    const container = document.getElementById('mobile-scroll-container');
    if (!container) return;

    const handleMobileScroll = () => {
      const categories = Object.keys(allMenuData);
      const scrollPos = container.scrollTop + 140; // Offset including header padding
      
      for (let i = categories.length - 1; i >= 0; i--) {
        const sec = document.getElementById(`mobile-cat-section-${categories[i]}`);
        if (sec && sec.offsetTop <= scrollPos) {
          setActiveCategory(categories[i]);
          break;
        }
      }
    };

    container.addEventListener('scroll', handleMobileScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleMobileScroll);
  }, [allMenuData, mode]);

  // ── Swipe Gestures (Only on Mobile Mode) ──
  useEffect(() => {
    if (mode !== 'mobile' || !paginatedMenuData) return;
    const el = document.getElementById('menu-main-container');
    if (!el) return;
    let startX = 0, startY = 0, startTime = 0;

    const onStart = (e) => {
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

      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.1 && dt < 350) {
        if (isFlippingRef.current) return;
        
        handleInteraction();
        if (dx < 0) {
          if (currentPageRef.current < totalPagesRef.current - 1) {
            const target = currentPageRef.current + 1;
            if (pflip.current) {
              try { pflip.current.turnToPage(target); } catch (_) { console.debug("pageflip error ignored", _); }
            }
            setCurrentPage(target);
            currentPageRef.current = target;
            if (navigator.vibrate) navigator.vibrate(12);
          }
        } else if (dx > 0) {
          if (currentPageRef.current > 0) {
            const target = currentPageRef.current - 1;
            if (pflip.current) {
              try { pflip.current.turnToPage(target); } catch (_) { console.debug("pageflip error ignored", _); }
            }
            setCurrentPage(target);
            currentPageRef.current = target;
            if (navigator.vibrate) navigator.vibrate(12);
          }
        }
      }
    };

    el.addEventListener('touchstart', onStart, { capture: true, passive: true });
    el.addEventListener('touchend', onEnd, { capture: true, passive: true });
    return () => {
      if (el) {
        el.removeEventListener('touchstart', onStart, { capture: true });
        el.removeEventListener('touchend', onEnd, { capture: true });
      }
    };
  }, [paginatedMenuData, mode, handleInteraction]);

  // PageFlip navigation functions
  const goToPage = useCallback((pageNum) => {
    handleInteraction();
    const pf = pflip.current;
    if (!pf) return;
    const maxPages = pf.getPageCount();
    if (pageNum < 0 || pageNum >= maxPages) return;
    
    try {
      pf.turnToPage(pageNum);
      setCurrentPage(pageNum);
      currentPageRef.current = pageNum;
    } catch (e) {
      console.warn("turnToPage failed:", e);
    }
    if (navigator.vibrate) navigator.vibrate(15);
  }, [handleInteraction]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
  }, [goToPage, currentPage]);

  const goNext = useCallback(() => {
    const pf = pflip.current;
    if (!pf) return;
    const maxPages = pf.getPageCount();
    if (currentPage < maxPages - 1) {
      goToPage(currentPage + 1);
    }
  }, [goToPage, currentPage]);

  // Auto-scroll category bar on mobile
  useEffect(() => {
    if (!isDesktop && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeBtn = container.children[currentPage];
      if (activeBtn) {
        const scrollLeft = activeBtn.offsetLeft - (container.clientWidth / 2) + (activeBtn.clientWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [currentPage, isDesktop]);

  // ── Desktop Scroll Active Category Tracking ──
  useEffect(() => {
    if (!isDesktop || !allMenuData) return;
    const categories = Object.keys(allMenuData);
    if (categories.length === 0) return;

    const handleScroll = () => {
      const scrollPos = window.scrollY + 140; // Offset including sticky bar
      const sections = categories.map(cat => document.getElementById(`cat-section-${cat}`));

      for (let i = sections.length - 1; i >= 0; i--) {
        const sec = sections[i];
        if (sec && sec.offsetTop <= scrollPos) {
          setActiveCategory(categories[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [allMenuData, isDesktop]);

  const brandColor     = config?.brand_color || '#B87D1A';
  const restaurantName = config?.name || 'Lukas Food';
  const isWideScreen   = vpWidth > 0 && vpWidth < window.innerWidth;
  const totalQty       = cart.reduce((acc, item) => acc + item.qty, 0);
  const totalStr       = `$${(totalPrice / 1000).toFixed(0)}k`;

  // ── LOADING STATE ──
  if (!allMenuData || !paginatedMenuData) return <LoadingSkeleton />;

  // ─── DESKTOP & TABLET VIEWPORT (EDITORIAL CINEMATOGRÁFICO) ──────────────────
  if (isDesktop || mode === 'tablet') {
    return (
      <DesktopEditorialView
        allMenuData={allMenuData}
        config={config}
        restaurantName={restaurantName}
        cart={cart}
        addToCart={addToCart}
        selectedProduct={selectedProduct}
        setSelectedProduct={handleSelectProduct}
        showCartDrawer={showCartDrawer}
        setShowCartDrawer={setShowCartDrawer}
        formatPriceFn={formatPrice}
      />
    );
  }


  // ─── TABLET VIEWPORT: CARTA VERTICAL RÁPIDA ──────────────────
  if (mode === 'tablet') {
    const categories = Object.keys(allMenuData || {});

    const scrollToMobileCategory = (catName) => {
      setActiveCategory(catName);
      const element = document.getElementById(`mobile-cat-section-${catName}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    const scrollToMenu = () => {
      const element = document.getElementById('menu-start-anchor');
      if (element) {
        const y = element.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    };

    return (
      <div className="luxury-editorial-menu min-h-screen w-full bg-[#FAF8F5] text-[#120F0D] flex flex-col font-sans antialiased overflow-x-hidden relative">
        <style>{`
          .luxury-editorial-menu {
            --bg-cream: #FAF8F5;
            --coal-black: #120F0D;
            --forest-green: #0C3A20;
            --gold: #B87D1A;
            --serif: 'Cormorant Garamond', Georgia, serif;
            --sans: 'Plus Jakarta Sans', system-ui, sans-serif;
          }
          .font-serif { font-family: var(--serif); }
          .font-sans { font-family: var(--sans); }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .editorial-tab {
            font-family: var(--sans);
            font-weight: 700;
            text-transform: uppercase;
            font-size: 0.72rem;
            letter-spacing: 0.18em;
            color: rgba(18, 15, 13, 0.4);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            padding: 1.25rem 0.5rem;
            position: relative;
          }
          .editorial-tab.active {
            color: var(--coal-black);
            font-weight: 800;
          }
        `}</style>



        {/* 2. STICKY EDITORIAL CATEGORY NAVIGATION */}
        <nav className="sticky top-0 z-40 w-full bg-[#FAF8F5]/85 backdrop-blur-xl border-b border-black/[0.04]">
          <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-10 overflow-x-auto no-scrollbar py-1">
              {desktopCategories.map((cat) => {
                const isActive = cat === activeCategory;
                return (
                  <button
                    key={cat}
                    onClick={() => scrollToCategory(cat)}
                    className={`editorial-tab ${isActive ? 'active' : ''}`}
                  >
                    {cat}
                    {isActive && (
                      <motion.div 
                        layoutId="editorialActiveIndicator"
                        className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-[#B87D1A] rounded-full"
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <span className="font-serif italic text-lg text-black/30 font-bold pr-2">
              {restaurantName}
            </span>
          </div>
        </nav>

        {/* 3. CENTER COLUMN: PORTFOLIO SHOWCASE */}
        <main className="w-full max-w-4xl mx-auto px-6 pt-16 pb-32">
          {desktopCategories.map((cat) => {
            const items = allMenuData[cat] || [];
            return (
              <section key={cat} id={`cat-section-${cat}`} className="py-10 scroll-mt-20">
                <div className="flex items-center gap-6 py-6">
                  <h2 className="font-serif italic text-4xl font-light tracking-tight text-[#120F0D]">
                    {cat}
                  </h2>
                  <div className="flex-1 h-[0.5px] bg-black/[0.08]" />
                  <span className="font-sans text-[8px] font-bold text-black/30 uppercase tracking-[0.2em]">
                    {items.length} Creaciones
                  </span>
                </div>

                <div className="flex flex-col">
                  {items.map((item, idx) => {
                    const isEven = idx % 2 === 0;
                    const itemImg = item.image || item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 35 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-120px" }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        className={`flex flex-col md:flex-row gap-8 md:gap-14 items-center py-12 md:py-16 border-b border-black/[0.03] last:border-b-0 ${
                          isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                        }`}
                      >
                        {/* Immersive Photo */}
                        <div 
                          className="w-full md:w-[55%] aspect-[16/11] rounded-[1.8rem] overflow-hidden bg-[#F7F2E9] relative group cursor-pointer shadow-md border border-black/[0.02]"
                          onClick={() => handleSelectProduct(item)}
                        >
                          <img 
                            src={itemImg} 
                            alt={item.name} 
                            className="w-full h-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                          />
                          {item.badge && (
                            <span className="absolute top-5 left-5 px-3.5 py-1.5 rounded-full text-[7.5px] font-black uppercase tracking-[0.25em] bg-white/95 text-[#0C3A20] shadow-sm">
                              ✦ {item.badge}
                            </span>
                          )}
                          {item.time && (
                            <span className="absolute bottom-5 right-5 px-2.5 py-0.5 rounded bg-black/60 text-white text-[8px] font-black uppercase tracking-wider">
                              ⏱ {item.time}
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="w-full md:w-[45%] flex flex-col justify-center space-y-5 text-left">
                          <div className="space-y-1.5">
                            <h3 className="font-serif italic text-3xl font-bold tracking-tight text-[#120F0D] leading-tight">
                              {item.name}
                            </h3>
                            <p className="text-sm text-black/80 font-medium leading-relaxed font-sans">
                              {item.desc || item.description || 'Una composición de sabores exclusivos elaborada con ingredientes seleccionados de primera calidad, diseñados por nuestro chef.'}
                            </p>
                          </div>

                          <div className="flex items-center gap-6 pt-2">
                            <span className="text-lg font-bold text-[#0C3A20] font-sans">
                              ${formatPrice(item.price)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.variants && item.variants.length > 0) {
                                  handleSelectProduct(item);
                                } else {
                                  addToCart(item);
                                  if (navigator.vibrate) navigator.vibrate(12);
                                }
                              }}
                              className="flex items-center gap-2 px-5 py-3 rounded-full border border-black/10 hover:border-black hover:bg-black hover:text-white transition-all text-[9px] font-black uppercase tracking-[0.2em] font-sans active:scale-95"
                            >
                              [+] Agregar
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </main>

        {/* 4. FLOATING GLASS CART FAB */}
        <AnimatePresence>
          {cart.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-8 right-8 z-50 pointer-events-none"
            >
              <button
                onClick={() => setShowCartDrawer(true)}
                className="pointer-events-auto py-4 px-7 rounded-full flex items-center gap-4 bg-[#120F0D]/90 text-white shadow-2xl border border-white/10 hover:bg-black transition-all active:scale-95"
                style={{
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
              >
                <span className="text-base">🛍️</span>
                <div className="flex flex-col text-left">
                  <span className="text-[7.5px] uppercase tracking-[0.25em] text-[#B87D1A] font-black leading-none mb-1">TU PEDIDO</span>
                  <span className="text-[10px] font-black uppercase tracking-wider leading-none">
                    {totalQty} platos · <span className="text-amber-400 font-bold">{totalStr}</span>
                  </span>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. CINEMATIC GLASS DRAWER */}
        <AnimatePresence>
          {showCartDrawer && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[900]"
                onClick={() => setShowCartDrawer(false)}
              />
              <motion.div
                initial={{ x: '120%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '120%', opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="fixed z-[901] flex flex-col top-4 bottom-4 right-4 w-[400px] rounded-[2rem] border shadow-2xl overflow-hidden"
                style={{
                  background: 'rgba(253, 248, 239, 0.85)',
                  backdropFilter: 'blur(30px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                  borderColor: 'rgba(18, 15, 13, 0.08)'
                }}
              >
                <div className="flex-1 overflow-hidden">
                  <CheckoutPanel isSidebar={false} onClose={() => setShowCartDrawer(false)} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Event Wizard Modal */}
        <AnimatePresence>
          {showEventWizard && (
            <EventWizard slug={config?.slug || 'la-rivera'} onClose={() => setShowEventWizard(false)} />
          )}
        </AnimatePresence>

        {/* Product Customizer & Options Modal */}
        <AnimatePresence>
          {selectedProduct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[950] flex items-center justify-center p-6 bg-black/75 backdrop-blur-md"
              onClick={() => setSelectedProduct(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 30 }}
                className="w-full max-w-md overflow-hidden bg-white rounded-[2.5rem] shadow-2xl border border-black/5 flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                <div className="relative aspect-[16/10] bg-black/5 flex-shrink-0">
                  <img
                    src={selectedProduct.image || selectedProduct.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
                    className="w-full h-full object-cover" 
                    alt={selectedProduct.name}
                  />
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center bg-white/80 backdrop-blur shadow text-black"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-6 text-left overflow-y-auto max-h-[55vh] no-scrollbar">
                  <div className="space-y-1">
                    {selectedProduct.badge && (
                      <span className="text-[8px] font-black uppercase tracking-[0.25em] text-[#B87D1A] block">
                        ✦ {selectedProduct.badge}
                      </span>
                    )}
                    <h3 className="text-xl font-bold tracking-tight text-[#120F0D]">{selectedProduct.name}</h3>
                    <p className="text-sm font-medium leading-relaxed text-black/80">
                      {selectedProduct.desc || selectedProduct.description || 'Una experiencia gastronómica exclusiva elaborada bajo estrictos estándares por nuestro chef de cocina.'}
                    </p>
                  </div>

                  {/* Variant Selector */}
                  {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                    <div className="space-y-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-black/30">Selecciona Opción</p>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedProduct.variants.map(v => (
                          <button 
                            key={v.id}
                            onClick={() => setSelectedProduct({...selectedProduct, selectedVariant: v})}
                            className={`px-4 py-3.5 rounded-xl text-[11px] font-bold transition-all border text-center ${
                              selectedProduct.selectedVariant?.id === v.id
                                ? 'bg-black text-white border-black'
                                : 'bg-black/5 text-[#120F0D]/75 border-transparent'
                            }`}
                          >
                            {v.name} (+${formatPrice(v.price)})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom Add Action */}
                  <div className="flex items-center justify-between border-t border-black/[0.04] pt-4 mt-2">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest text-black/30 font-bold">PRECIO</span>
                      <span className="text-2xl font-black text-[#0C3A20]">
                        ${formatPrice(selectedProduct.selectedVariant ? selectedProduct.selectedVariant.price : selectedProduct.price)}
                      </span>
                    </div>
                    <button
                      onClick={() => { 
                        const toAdd = selectedProduct.selectedVariant 
                          ? { ...selectedProduct, price: selectedProduct.selectedVariant.price, variant_id: selectedProduct.selectedVariant.id, name: `${selectedProduct.name} (${selectedProduct.selectedVariant.name})` }
                          : selectedProduct;
                        addToCart(toAdd); 
                        setSelectedProduct(null); 
                        if (navigator.vibrate) navigator.vibrate(12);
                      }}
                      className="px-8 py-4.5 rounded-full font-bold uppercase text-[9px] tracking-[0.2em] bg-[#120F0D] text-white hover:bg-[#0C3A20] transition-colors active:scale-95"
                    >
                      Añadir a la Orden
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }



  // ─── MOBILE VIEWPORT: THE ORIGINAL SWIPABLE PageFlip BOOK ──────────────────
  const mobileCategories = Object.keys(paginatedMenuData);
  const totalPages       = mobileCategories.length;

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
            {mobileCategories.map((cat, i) => {
              const meta = CATEGORY_META[cat] || { icon: '🍽️', label: cat };
              const isActive = i === currentPage;
              return (
                <button key={i} onClick={() => goToPage(i)}
                  className="relative flex items-center justify-center px-4 py-2.5 rounded-full transition-all duration-300 ease-out active:scale-95"
                  style={{
                    touchAction: 'manipulation',
                    color: isActive ? '#1a1008' : 'rgba(30, 20, 8, 0.45)',
                    flexShrink: 0,
                    minWidth: isActive ? 100 : 48,
                  }}>
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryMobile"
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

        {/* Swipable Book Container */}
        <div className="relative w-full h-full overflow-hidden">
          <div
            key={refetchTrigger}
            ref={bookRef}
            className="w-full h-full"
            style={{
              touchAction:   'none',
              pointerEvents: document.body.classList.contains('checkout-open') ? 'none' : 'auto',
            }}
          >
            {mobileCategories.map((cat, pageIdx) => {
              const items    = paginatedMenuData[cat] || [];
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
                    onClick={e => e.stopPropagation()}
                  >


                    {/* Spine shadow */}
                    <div className="absolute right-0 top-0 bottom-0 w-[22px] pointer-events-none z-30"
                      style={{ background:'linear-gradient(to left, rgba(0,0,0,0.07), transparent)' }} />

                    {/* Paper grain */}
                    <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-[0.015]"
                      style={{ backgroundImage:'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }} />

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
                    <div className="mb-2 relative z-20 pl-1">
                      <div className="flex items-center justify-end mb-1">
                        <span className="font-mono text-[10px] italic"
                          style={{ color:'rgba(30,20,8,0.2)' }}>
                          {String(pageIdx + 1).padStart(2,'0')}
                          {'\u2009/\u2009'}
                          {String(totalPages).padStart(2,'0')}
                        </span>
                      </div>
                    </div>

                    {/* Products list */}
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
                          onSelect={() => { handleSelectProduct(item); handleInteraction(); }}
                        />
                      ))}
                    </div>


                  </div>
                </div>
              );
            })}
          </div>

          {/* Corner peel mobile invite */}
          <CornerPeel
            visible={showPeel && currentPage < totalPages - 1}
            accent={brandColor}
          />
        </div>

        {/* BOTTOM NAVIGATION NAVIGATION BAR */}
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
          {/* Event button */}
          <button
            onClick={(e) => { 
              e.preventDefault();
              e.stopPropagation();
              setShowEventWizard(true); 
              handleInteraction(); 
            }}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 flex-shrink-0 active:scale-95 transition-all"
            style={{
              background: 'linear-gradient(to right, rgb(252, 211, 77) 0%, rgb(245, 158, 11) 100%)',
              border: '0.5px solid rgba(245, 158, 11, 0.4)',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
              touchAction: 'manipulation',
            }}
          >
            <span style={{ fontSize: 13, lineHeight: 1 }}>🎟️</span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em]"
              style={{ color: '#1a1008' }}>Evento</span>
          </button>

          {/* Prev Navigation Arrow */}
          <NavArrow direction="prev" visible={currentPage > 0} onClick={goPrev} />

          {/* Nav pagination dots */}
          <div className="flex-1 flex items-center justify-center gap-1.5 overflow-hidden px-1">
            {mobileCategories.map((_, i) => (
              <div key={i}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goToPage(i);
                }}
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

          {/* Next Navigation Arrow */}
          <NavArrow direction="next" visible={currentPage < totalPages - 1} onClick={goNext} />
        </div>
      </div>

      {/* Event Wizard Modal */}
      <AnimatePresence>
        {showEventWizard && (
          <EventWizard slug={config?.slug || 'la-rivera'} onClose={() => setShowEventWizard(false)} />
        )}
      </AnimatePresence>

      {/* Original Mobile Product Customizer Selector Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="absolute inset-0 z-[500] flex items-center justify-center p-6"
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
                  src={selectedProduct.image || selectedProduct.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
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
                    Selección del Chef
                  </span>
                </div>
                <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-[0.8] mb-4"
                  style={{ color:'#1a1008' }}>{selectedProduct.name}</h3>
                <p className="text-[13px] font-medium leading-relaxed mb-10"
                  style={{ color:'rgba(30,20,8,0.75)' }}>
                  {selectedProduct.description || 'Una experiencia gourmet diseñada para elevar tus sentidos.'}
                </p>
                <div className="flex flex-col gap-4">
                  {/* Variant Selector */}
                  {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                    <div className="space-y-3 mb-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/40">Selecciona Opción</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {selectedProduct.variants.map(v => (
                          <button 
                            key={v.id}
                            onClick={() => setSelectedProduct({...selectedProduct, selectedVariant: v})}
                            className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                              selectedProduct.selectedVariant?.id === v.id
                                ? 'bg-dark text-bone border-dark'
                                : 'bg-white/50 text-dark border-dark/10'
                            }`}
                          >
                            {v.name} (+${formatPrice(v.price)})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm" style={{ color:'rgba(30,20,8,0.3)' }}>{'$'}</span>
                    <span className="text-4xl font-black" style={{ color:'#1a1008' }}>
                      {formatPrice(selectedProduct.selectedVariant ? selectedProduct.selectedVariant.price : selectedProduct.price)}
                    </span>
                  </div>
                  <button
                    onClick={() => { 
                      const toAdd = selectedProduct.selectedVariant 
                        ? { ...selectedProduct, price: selectedProduct.selectedVariant.price, variant_id: selectedProduct.selectedVariant.id, name: `${selectedProduct.name} (${selectedProduct.selectedVariant.name})` }
                        : selectedProduct;
                      addToCart(toAdd); 
                      setSelectedProduct(null); 
                    }}
                    className="w-full py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] active:scale-95 transition-all tactile-button"
                    style={{ color:'#1a1008', background: brandColor }}>
                    ✦ Añadir a la Orden
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop letterbox wrapper label */}
      {isWideScreen && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ opacity:0.22 }}>
          <span className="text-[9px] font-black uppercase tracking-[0.35em]" style={{ color:'#f59e0b' }}>
            {restaurantName || 'Lacarta'} · Menú Móvil
          </span>
        </div>
      )}
    </div>
  );
};
