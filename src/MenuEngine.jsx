import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MENU_DATA, CATEGORY_META } from './MenuData';
import { useCart } from './CartContext';

/* ════════════════════════════════════════════════════════════
   VARIANTES DE PÁGINA — EFECTO "HOJA DOBLADA"
   custom prop inyecta `direction` (+1 adelante / -1 atrás).
════════════════════════════════════════════════════════════ */
const PAGE_VARIANTS = {
  initial: (dir) => ({
    rotateY: dir > 0 ?  110 : -110,
    skewY:   dir > 0 ?  -12 :  12,
    x:       dir > 0 ?   80 :  -80,
    opacity: 0,
    scale: 0.92,
  }),
  animate: {
    rotateY: 0, skewY: 0, x: 0, opacity: 1, scale: 1,
    transition: { duration: 0.82, ease: [0.15, 0.85, 0.35, 1] },
  },
  exit: (dir) => ({
    rotateY: dir > 0 ? -115 :  115,
    skewY:   dir > 0 ?   16 :  -16,
    opacity: 0, scale: 0.82,
    transition: { duration: 0.65, ease: [0.4, 0, 0.6, 1] },
  }),
};

const FAST_VARIANTS = {
  initial: (dir) => ({
    rotateY: dir > 0 ?  90 : -90,
    skewY:   dir > 0 ?  -8 :   8,
    opacity: 0, scale: 0.95,
  }),
  animate: {
    rotateY: 0, skewY: 0, opacity: 1, scale: 1,
    transition: { duration: 0.22, ease: 'easeInOut' },
  },
  exit: (dir) => ({
    rotateY: dir > 0 ? -90 :  90,
    skewY:   dir > 0 ?  12 : -12,
    opacity: 0, scale: 0.9,
    transition: { duration: 0.18, ease: 'easeIn' },
  }),
};

/* ════════════════════════════════════════════════════════════
   PRODUCT CELL — Layout estricto 2 columnas para mobile
   ─────────────────────────────────────────────────────────
   Al presionar:
   1. addToCart → FloatingCart recibe key={totalItems} y dispara
      la animación de confirmación scale 1.2 → 1.
   2. Estado local `added` muestra un flash verde de 700 ms.
════════════════════════════════════════════════════════════ */
const ProductCell = ({ item, index, accent }) => {
  const { addToCart, cart } = useCart();
  const [added, setAdded] = useState(false);

  const qty = cart.find(i => i.id === item.id)?.qty ?? 0;

  const handleAdd = () => {
    addToCart(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 650);
  };

  return (
    <motion.button
      id={`product-cell-${item.id}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.055, duration: 0.3, ease: 'easeOut' }}
      whileTap={{ scale: 0.91 }}
      onClick={handleAdd}
      /*
        Layout: flex-col, altura fija para que las 2 columnas
        se mantengan uniformes sin importar el texto.
      */
      className="relative flex flex-col items-start text-left rounded-2xl p-3 overflow-hidden"
      style={{
        minHeight: '110px',
        background: added
          ? `rgba(16,185,129,0.18)`
          : `rgba(255,255,255,0.045)`,
        border: `1px solid ${added ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
        transition: 'background 0.3s, border-color 0.3s',
      }}
    >
      {/* Flash de confirmar agregado */}
      <AnimatePresence>
        {added && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            className="absolute inset-0 flex items-center justify-center z-20 rounded-2xl"
            style={{ background: 'rgba(16,185,129,0.12)' }}
          >
            <span className="text-2xl">✓</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge de cantidad */}
      {qty > 0 && (
        <motion.div
          key={qty}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black z-10"
          style={{ background: accent, color: '#050505' }}
        >
          {qty}
        </motion.div>
      )}

      {/* Emoji */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-2 flex-shrink-0"
        style={{ background: `${accent}18` }}
      >
        {item.emoji}
      </div>

      {/* Name */}
      <p
        className="text-[11px] font-bold text-white uppercase leading-tight line-clamp-2 flex-1"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {item.name}
      </p>

      {/* Price */}
      <p
        className="text-sm font-black mt-1.5"
        style={{
          color: accent,
          fontFamily: "'JetBrains Mono', monospace",
          textShadow: `0 0 10px ${accent}55`,
        }}
      >
        {item.price}
      </p>
    </motion.button>
  );
};

/* ─── CATEGORY TAB ─── */
const CategoryTab = ({ cat, idx, isActive, isFlipping, onClick }) => {
  const meta = CATEGORY_META[cat];
  return (
    <motion.button
      id={`cat-tab-${idx}`}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      disabled={isFlipping}
      className="relative overflow-hidden rounded-r-xl flex items-center justify-center transition-all duration-300"
      style={{
        writingMode: 'vertical-rl',
        textOrientation: 'mixed',
        width: '38px',
        minHeight: '72px',
        background: isActive
          ? `linear-gradient(180deg, ${meta.accent}, ${meta.accent}cc)`
          : 'rgba(255,255,255,0.04)',
        border: isActive
          ? `1px solid ${meta.accent}88`
          : '1px solid rgba(255,255,255,0.07)',
        borderLeft: 'none',
        boxShadow: isActive ? `4px 0 20px ${meta.accent}44` : 'none',
        transform: isActive ? 'translateX(0)' : 'translateX(-2px)',
      }}
    >
      <span
        className="text-[9px] font-black uppercase tracking-[0.15em]"
        style={{ color: isActive ? '#050505' : 'rgba(255,255,255,0.3)' }}
      >
        {cat}
      </span>
    </motion.button>
  );
};

/* ════════════════════════════════════════════════════════════
   MAIN ENGINE
════════════════════════════════════════════════════════════ */
export const MenuEngine = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection]     = useState(1);
  const [isFlipping, setIsFlipping]   = useState(false);
  const lock = useRef(false);

  const categories = Object.keys(MENU_DATA);
  const cat        = categories[currentPage];
  const meta       = CATEGORY_META[cat];
  const items      = MENU_DATA[cat];
  const variants   = isFlipping ? FAST_VARIANTS : PAGE_VARIANTS;

  /* ── Paginar una sola hoja ── */
  const paginate = useCallback((dir) => {
    const next = currentPage + dir;
    if (next < 0 || next >= categories.length || lock.current) return;
    lock.current = true;
    setDirection(dir);
    setCurrentPage(next);
    setTimeout(() => { lock.current = false; }, isFlipping ? 240 : 860);
  }, [currentPage, categories.length, isFlipping]);

  /* ── Salto rápido con ráfaga de hojas ── */
  const jumpToPage = useCallback(async (target) => {
    if (target === currentPage || lock.current) return;
    lock.current = true;
    setIsFlipping(true);

    const dir   = target > currentPage ? 1 : -1;
    const steps = Math.abs(target - currentPage);
    setDirection(dir);

    for (let i = 0; i < steps; i++) {
      await new Promise(r => setTimeout(r, 130));
      setCurrentPage(prev => prev + dir);
    }

    setIsFlipping(false);
    lock.current = false;
  }, [currentPage]);

  /* ── Swipe horizontal ── */
  const handleDragEnd = useCallback((_, info) => {
    if (Math.abs(info.offset.x) < 50 || lock.current) return;
    paginate(info.offset.x < 0 ? 1 : -1);
  }, [paginate]);

  return (
    <div className="perspective-container touch-none">

      {/* Ambient glow por categoría */}
      <motion.div
        animate={{ background: `radial-gradient(ellipse at 28% 45%, ${meta.accent}1a 0%, transparent 65%)` }}
        transition={{ duration: 0.7 }}
        className="absolute inset-0 pointer-events-none"
      />

      {/* ── Zonas de tap de pulgar ── */}
      <div
        className="absolute inset-y-0 left-[38px] w-12 z-[110]"
        onClick={() => paginate(-1)}
        aria-label="Página anterior"
      />
      <div
        className="absolute inset-y-0 right-0 w-12 z-[110]"
        onClick={() => paginate(1)}
        aria-label="Página siguiente"
      />

      {/* ── Category Tabs (sidebar izquierdo) ── */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-[100] flex flex-col gap-1.5">
        {categories.map((c, idx) => (
          <CategoryTab
            key={c}
            cat={c}
            idx={idx}
            isActive={currentPage === idx}
            isFlipping={isFlipping}
            onClick={() => jumpToPage(idx)}
          />
        ))}
      </div>

      {/* ════ PAGE ════ */}
      <AnimatePresence mode="popLayout" custom={direction}>
        <motion.div
          key={currentPage}
          custom={direction}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.07}
          onDragEnd={handleDragEnd}
          className="page-pivot glass-card absolute rounded-r-[2.5rem] overflow-hidden"
          style={{
            left: '44px',
            right: '12px',
            top: '2rem',
            bottom: '2rem',
            transformOrigin: 'left center',          /* doble garantía */
            boxShadow: '25px 0 60px -15px rgba(0,0,0,0.8)',
          }}
        >
          {/* Sombra de doblez */}
          <motion.div
            className="fold-shadow"
            animate={{ opacity: lock.current ? 1 : 0 }}
            transition={{ duration: 0.15 }}
          />

          {/* Lomo */}
          <div className="spine-shadow" />

          {/* ── Contenido ── */}
          <div className="relative z-20 flex flex-col h-full px-4 pt-5 pb-4">

            {/* Header */}
            <div className="mb-3 pl-1">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{meta.icon}</span>
                  <span
                    className="text-[10px] uppercase tracking-[0.28em] font-semibold"
                    style={{ color: meta.accent }}
                  >
                    {meta.label}
                  </span>
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{
                    background: `${meta.accent}1a`,
                    border: `1px solid ${meta.accent}44`,
                    color: meta.accent,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {String(currentPage + 1).padStart(2, '0')}
                </div>
              </div>

              <h2
                className="text-2xl font-black uppercase leading-none tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: 'white' }}
              >
                {cat}
              </h2>

              <div className="mt-2 h-px"
                style={{ background: `linear-gradient(90deg, ${meta.accent}aa, transparent)` }} />
            </div>

            {/* ── GRID 2 COLUMNAS ── */}
            {/*
              grid-cols-2 estricto: garantiza exactamente 2 productos por fila
              en cualquier ancho de pantalla mobile (320px–430px).
              El scroll vertical está habilitado sólo dentro de esta área.
            */}
            <div
              className="flex-1 grid grid-cols-2 gap-2.5 content-start overflow-y-auto"
              style={{
                touchAction: 'pan-y',                 /* scroll vertical sin romper el swipe horizontal */
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                scrollbarWidth: 'none',
                paddingBottom: '4px',
              }}
            >
              {items.map((item, idx) => (
                <ProductCell
                  key={item.id}
                  item={item}
                  index={idx}
                  accent={meta.accent}
                />
              ))}
            </div>

            {/* Footer: progress dots */}
            <div className="mt-3 flex items-center justify-between pl-1">
              <div className="flex gap-1.5">
                {categories.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      width:      i === currentPage ? 18 : 5,
                      background: i === currentPage ? meta.accent : 'rgba(255,255,255,0.15)',
                    }}
                    transition={{ duration: 0.28 }}
                    className="h-1 rounded-full"
                  />
                ))}
              </div>
              <p className="text-[9px] uppercase tracking-[0.45em] text-white/20">
                — desliza —
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
