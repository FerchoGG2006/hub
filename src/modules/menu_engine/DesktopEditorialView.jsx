import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { CATEGORY_META } from './MenuData';
import { CheckoutPanel } from './CheckoutPanel';

/* ═══════════════════════════════════════════════════════════
   PRICE FORMATTER (shared)
   ═══════════════════════════════════════════════════════════ */
const formatPrice = (price) => {
  if (typeof price === 'number') return price.toLocaleString('es-CO');
  if (!price) return '0';
  let str = String(price).trim();
  if (str.toLowerCase().endsWith('k')) str = str.slice(0, -1) + '.000';
  if (str.startsWith('$')) str = str.substring(1).trim();
  return str;
};

/* ═══════════════════════════════════════════════════════════
   ANIMATED PRODUCT BLOCK — alternating editorial layout
   ═══════════════════════════════════════════════════════════ */
const EditorialProduct = ({ item, index, accent, onSelect }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const isReversed = index % 2 !== 0;
  const hasImage = item.image || item.image_url;

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
      onClick={() => onSelect(item)}
      className={`group grid gap-8 items-center cursor-pointer py-10 border-b border-black/[0.04] hover:bg-black/[0.015] transition-colors px-4 rounded-xl ${
        hasImage 
          ? (isReversed ? 'grid-cols-[1fr_280px]' : 'grid-cols-[280px_1fr]')
          : 'grid-cols-1 max-w-2xl'
      }`}
      style={{ direction: isReversed && hasImage ? 'rtl' : 'ltr' }}
    >
      {/* Image */}
      {hasImage && (
        <div className="overflow-hidden rounded-2xl aspect-[4/3] bg-black/5" style={{ direction: 'ltr' }}>
          <img
            src={item.image || item.image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
            loading="lazy"
          />
        </div>
      )}

      {/* Text */}
      <div className="space-y-3" style={{ direction: 'ltr' }}>
        {item.badge && (
          <span
            className="inline-block text-[8px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full"
            style={{ color: accent, backgroundColor: `${accent}14` }}
          >
            ✦ {item.badge}
          </span>
        )}

        <h3 className="font-serif text-2xl font-bold tracking-tight text-[#120F0D] leading-snug group-hover:text-[#0C3A20] transition-colors">
          {item.emoji && <span className="mr-2 text-xl">{item.emoji}</span>}
          {item.name}
        </h3>

        {(item.desc || item.description) && (
          <p className="text-[15px] text-black/80 leading-relaxed font-medium max-w-md">
            {item.desc || item.description}
          </p>
        )}

        <div className="flex items-center gap-4 pt-1">
          <span className="font-serif italic text-xl font-bold" style={{ color: accent }}>
            ${formatPrice(item.price)}
          </span>
          {!item.is_available && (
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-red-400 bg-red-50 px-2.5 py-1 rounded-full">
              Agotado
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
};

/* ═══════════════════════════════════════════════════════════
   CATEGORY SECTION — editorial category header + products
   ═══════════════════════════════════════════════════════════ */
const CategorySection = ({ name, items, meta, onSelectProduct }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <section id={`cat-section-${name}`} ref={ref} className="pt-8 pb-4">

      <div className="space-y-0">
        {items
          .filter(item => item.is_available !== false)
          .map((item, idx) => (
            <EditorialProduct
              key={item.id}
              item={item}
              index={idx}
              accent={meta.accent}
              onSelect={onSelectProduct}
            />
          ))}
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════
   DESKTOP EDITORIAL VIEW — Main Component
   ═══════════════════════════════════════════════════════════ */
export const DesktopEditorialView = ({
  allMenuData,
  config,
  restaurantName,
  cart,
  addToCart,
  selectedProduct,
  setSelectedProduct,
  showCartDrawer,
  setShowCartDrawer,
  formatPriceFn,
}) => {
  const [activeCategory, setActiveCategory] = useState(null);
  const categories = Object.keys(allMenuData || {});
  const navRef = useRef(null);

  // Set default active category
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  // Intersection Observer for active category tracking on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const catName = entry.target.id.replace('cat-section-', '');
            setActiveCategory(catName);
          }
        }
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: 0 }
    );

    categories.forEach((cat) => {
      const el = document.getElementById(`cat-section-${cat}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories]);

  const scrollToCategory = (catName) => {
    setActiveCategory(catName);
    const el = document.getElementById(`cat-section-${catName}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const totalPrice = cart.reduce((acc, item) => {
    const p = typeof item.price === 'number' ? item.price : parseInt(String(item.price).replace(/[^\d]/g, ''), 10) || 0;
    return acc + p * item.qty;
  }, 0);
  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
  const totalStr = `$${(totalPrice / 1000).toFixed(0)}k`;

  // Dynamic brand accent
  const brandAccent = config?.brand_color || '#B87D1A';

  return (
    <div className="editorial-desktop-root min-h-screen w-full bg-[#FAF8F5] text-[#120F0D] font-sans antialiased overflow-x-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        .editorial-desktop-root {
          --bg-cream: #FAF8F5;
          --coal-black: #120F0D;
          --brand-accent: ${brandAccent};
          --serif: 'Cormorant Garamond', Georgia, serif;
          --sans: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .editorial-desktop-root .font-serif { font-family: var(--serif); }
        .editorial-desktop-root .font-sans { font-family: var(--sans); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ─── EDITORIAL HEADER ─── */}
      <header className="w-full border-b border-black/[0.05] bg-[#FAF8F5]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-8 py-6 flex items-end justify-between">
          <div>
            <h1 className="font-serif italic text-4xl font-bold tracking-tight text-[#120F0D] leading-none">
              {restaurantName}
            </h1>
          </div>
          {config?.logo_url && (
            <img src={config.logo_url} alt="" className="h-10 w-10 rounded-full object-cover border border-black/10" />
          )}
        </div>
      </header>

      {/* ─── STICKY CATEGORY NAVIGATION ─── */}
      <nav ref={navRef} className="sticky top-0 z-40 w-full bg-[#FAF8F5]/85 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-5xl mx-auto px-8 flex items-center gap-8 overflow-x-auto no-scrollbar">
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat] || { accent: '#f59e0b', icon: '🍽️', label: cat };
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => scrollToCategory(cat)}
                className="relative py-4 whitespace-nowrap transition-all duration-300"
                style={{
                  fontFamily: 'var(--sans)',
                  fontWeight: isActive ? 800 : 700,
                  textTransform: 'uppercase',
                  fontSize: '0.72rem',
                  letterSpacing: '0.18em',
                  color: isActive ? '#120F0D' : 'rgba(18, 15, 13, 0.35)',
                }}
              >
                {cat}
                {isActive && (
                  <motion.div
                    layoutId="editorialNavIndicator"
                    className="absolute bottom-0 left-1 right-1 h-[2.5px] rounded-full"
                    style={{ backgroundColor: meta.accent }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ─── EDITORIAL PRODUCT SECTIONS ─── */}
      <main className="max-w-5xl mx-auto px-8 pb-32">
        <div id="menu-start-anchor" />
        {categories.map((cat) => {
          const items = allMenuData[cat] || [];
          const meta = CATEGORY_META[cat] || { accent: '#f59e0b', icon: '🍽️', label: cat };
          return (
            <CategorySection
              key={cat}
              name={cat}
              items={items}
              meta={meta}
              onSelectProduct={(item) => setSelectedProduct(item)}
            />
          );
        })}
      </main>

      {/* ─── FLOATING CART FAB ─── */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <button
              onClick={() => setShowCartDrawer(true)}
              className="py-4 px-7 rounded-full flex items-center gap-4 bg-[#120F0D]/90 text-white shadow-2xl border border-white/10 hover:bg-black transition-all active:scale-95"
              style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
            >
              <span className="text-base">🛍️</span>
              <div className="flex flex-col text-left">
                <span className="text-[7.5px] uppercase tracking-[0.25em] font-black leading-none mb-1" style={{ color: brandAccent }}>
                  Tu Pedido
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider leading-none">
                  {totalQty} platos · <span className="text-amber-400 font-bold">{totalStr}</span>
                </span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CART DRAWER ─── */}
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
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed z-[901] flex flex-col inset-y-0 right-0 w-[420px] rounded-l-[2.5rem] border-l shadow-2xl"
              style={{
                background: 'rgba(253, 248, 239, 0.96)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                borderLeftColor: 'rgba(18, 15, 13, 0.06)',
              }}
            >
              <div className="flex-1 overflow-hidden p-2">
                <CheckoutPanel isSidebar={false} onClose={() => setShowCartDrawer(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── PRODUCT DETAIL MODAL ─── */}
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
              onClick={(e) => e.stopPropagation()}
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
                    <span className="text-[8px] font-black uppercase tracking-[0.25em] block" style={{ color: brandAccent }}>
                      ✦ {selectedProduct.badge}
                    </span>
                  )}
                  <h3 className="text-xl font-bold tracking-tight text-[#120F0D]">{selectedProduct.name}</h3>
                  <p className="text-sm font-medium leading-relaxed text-black/80">
                    {selectedProduct.desc || selectedProduct.description || 'Una experiencia gastronómica exclusiva.'}
                  </p>
                </div>

                {/* Variant Selector */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-black/30">Selecciona Opción</p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedProduct.variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedProduct({ ...selectedProduct, selectedVariant: v })}
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

                {/* Add to Cart */}
                <div className="flex items-center justify-between border-t border-black/[0.04] pt-4 mt-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-widest text-black/30 font-bold">Precio</span>
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
                    className="px-8 py-4 rounded-full font-bold uppercase text-[9px] tracking-[0.2em] bg-[#120F0D] text-white hover:bg-[#0C3A20] transition-colors active:scale-95"
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
};
