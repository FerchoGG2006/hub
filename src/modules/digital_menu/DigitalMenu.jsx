import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuCard } from './components/MenuCard';
import { BottomSheet } from './components/BottomSheet';
import { CartFooter } from './components/CartFooter';

/* ─── Datos del menú con imágenes reales ─── */
const MENU_DATA = [
  {
    category: "GALLETAS",
    id: "galletas",
    icon: "🍪",
    items: [
      {
        id: "g1", name: "Galleta de Pistachos", numericPrice: 7000, price: "7K",
        description: "Crujiente por fuera, suave por dentro y con pistachos reales. ¡Irresistible!",
        image: "/images/pistachio.png", emoji: "🍪"
      },
      {
        id: "g2", name: "Galleta Red", numericPrice: 6000, price: "6K",
        description: "Red velvet con chips blancos. Suave, intensa y deliciosa.",
        image: "/images/red_velvet.png", emoji: "🔴"
      },
      {
        id: "g3", name: "Galleta Snickers", numericPrice: 7000, price: "7K",
        description: "Chocolate, maní y caramelo. La galleta que lo tiene todo.",
        image: "/images/snickers.png", emoji: "🥜"
      },
      {
        id: "g4", name: "Galleta Chips de Chocolate", numericPrice: 6000, price: "6K",
        description: "Clásica, reconfortante y cargada de chips de chocolate.",
        image: "/images/choc_chip.png", emoji: "🍫"
      }
    ]
  },
  {
    category: "BROWNIES & BROOKIE",
    id: "brownies",
    icon: "🤎",
    items: [
      {
        id: "b1", name: "Brookie", numericPrice: 8000, price: "8K",
        description: "La mejor combinación que existe: brownie + cookie. Fudgy y perfecta.",
        image: "/images/brookie.png", emoji: "🤎"
      },
      {
        id: "b2", name: "Brownie de Arequipe", numericPrice: 7000, price: "7K",
        description: "Húmedo, intenso y con el toque perfecto de arequipe.",
        image: "/images/arequipe.png", emoji: "🍯"
      },
      {
        id: "b3", name: "Brownie de Milo", numericPrice: 6000, price: "6K",
        description: "Suave, chocolatoso y con todo el sabor único de Milo.",
        image: "/images/milo.png", emoji: "🥛"
      }
    ]
  }
];

/* ─── Paw Prints con posiciones orgánicas ─── */
const PAW_POSITIONS = [
  { top: '2%', left: '4%', rotate: -20, scale: 1.1 },
  { top: '4%', right: '6%', rotate: 25, scale: 0.85 },
  { top: '9%', right: '2%', rotate: 40, scale: 0.95 },
  { top: '14%', left: '1%', rotate: -35, scale: 0.7 },
  { top: '22%', right: '3%', rotate: 15, scale: 1.0 },
  { top: '30%', left: '3%', rotate: -10, scale: 0.8 },
  { top: '40%', right: '1%', rotate: 30, scale: 0.75 },
  { top: '48%', left: '5%', rotate: -25, scale: 0.9 },
  { top: '58%', right: '5%', rotate: 20, scale: 1.05 },
  { top: '66%', left: '2%', rotate: -15, scale: 0.85 },
  { top: '76%', right: '4%', rotate: 35, scale: 0.7 },
  { top: '84%', left: '6%', rotate: -5, scale: 0.95 },
  { top: '90%', right: '2%', rotate: 10, scale: 0.8 },
  { top: '96%', left: '3%', rotate: -30, scale: 0.75 },
];

const PawPrints = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
    {PAW_POSITIONS.map((p, i) => (
      <span
        key={i}
        className="absolute text-[#5C3520] select-none"
        style={{
          top: p.top, left: p.left, right: p.right,
          transform: `rotate(${p.rotate}deg) scale(${p.scale})`,
          opacity: 0.06 + (i % 3) * 0.015,
          fontSize: '1.6rem',
        }}
      >
        🐾
      </span>
    ))}
  </div>
);

/* ─── Category divider ─── */
const CategoryDivider = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, scaleX: 0.5 }}
    animate={{ opacity: 1, scaleX: 1 }}
    transition={{ duration: 0.5 }}
    className="flex items-center gap-3 py-1 scroll-mt-6"
  >
    <div className="flex-1 h-[1.5px] bg-gradient-to-r from-transparent via-[#8B5E3C]/40 to-[#8B5E3C]/40" />
    <span className="text-[#5C3520] font-black text-[10px] uppercase tracking-[0.35em] flex items-center gap-2 whitespace-nowrap">
      <span className="text-[#C4956A] text-[8px]">◆</span>
      {children}
      <span className="text-[#C4956A] text-[8px]">◆</span>
    </span>
    <div className="flex-1 h-[1.5px] bg-gradient-to-l from-transparent via-[#8B5E3C]/40 to-[#8B5E3C]/40" />
  </motion.div>
);

/* ─── Trust badges (las 5 secciones interactivas) ─── */
const TRUST_BADGES = [
  { id: "calidad", emoji: "🏅", label: "INGREDIENTES\nDE CALIDAD", detail: "Usamos mantequilla 100% pura, chocolates importados y toppings reales." },
  { id: "amor", emoji: "❤️", label: "HECHOS CON\nMUCHO AMOR", detail: "Recetas artesanales horneadas diariamente en pequeños lotes." },
  { id: "sabor", emoji: "🐾", label: "MÁS PERRÓN,\nMÁS SABOR", detail: "El equilibrio perfecto entre suavidad, textura fudgy e intensidad." },
  { id: "energia", emoji: "⚡", label: "ENERGÍA\nPARA TU DÍA", detail: "El empujón dulce perfecto para recargar tus energías a cualquier hora." },
  { id: "antojo", emoji: "✨", label: "PERFECTOS PARA\nCUALQUIER ANTOJO", detail: "Ideales para compartir, regalar o darte el gusto que te mereces." },
];

/* ════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ════════════════════════════════════════════════════ */
export const DigitalMenu = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);

  const openProduct = (product) => {
    setSelectedProduct(product);
    setIsSheetOpen(true);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleAddToCart = (productWithQuantity) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === productWithQuantity.id);
      if (existing) {
        return prev.map(item =>
          item.id === productWithQuantity.id
            ? { ...item, quantity: item.quantity + productWithQuantity.quantity }
            : item
        );
      }
      return [...prev, productWithQuantity];
    });

    showToast(`¡Añadido! ${productWithQuantity.quantity}x ${productWithQuantity.name}`);
  };

  const getCartQuantity = (productId) => {
    const item = cartItems.find(i => i.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden font-sans" style={{
      background: 'linear-gradient(180deg, #5C3520 0%, #7A4E35 10%, #A87B5A 28%, #C4956A 45%, #D8B48E 62%, #E8CEAE 78%, #F0DCC4 100%)'
    }}>
      <PawPrints />

      {/* Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#3E1F0D] text-[#FFF8F0] px-4 py-2.5 rounded-full shadow-2xl border border-[#C4956A]/40 text-xs font-bold flex items-center gap-2"
          >
            <span>✨</span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popover / Modal de información para cada badge */}
      <AnimatePresence>
        {selectedBadge && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBadge(null)}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#FFF8F0] border-2 border-[#8B5E3C] p-6 rounded-3xl max-w-xs text-center shadow-2xl"
            >
              <span className="text-4xl block mb-2">{selectedBadge.emoji}</span>
              <h4 className="text-[#3E1F0D] font-black text-sm uppercase tracking-wider mb-2">{selectedBadge.label.replace('\n', ' ')}</h4>
              <p className="text-[#8B6F56] text-xs leading-relaxed mb-4">{selectedBadge.detail}</p>
              <button
                onClick={() => setSelectedBadge(null)}
                className="bg-[#5C3520] text-white font-bold text-xs uppercase tracking-widest px-5 py-2 rounded-xl"
              >
                Entendido 🐾
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Contenedor principal con "marco" ── */}
      <div className="relative z-10 max-w-[420px] mx-auto px-4 pb-36">

        {/* ═══ HEADER ═══ */}
        <header className="pt-10 pb-4 text-center flex flex-col items-center">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative mb-1"
          >
            <div className="w-24 h-24 bg-[#FFF8F0] rounded-full flex items-center justify-center shadow-xl overflow-hidden border-3 border-[#5C3520] p-1">
              <img src="/images/logo.png" alt="Más Perrón Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#3E1F0D] text-[#F0DCC4] text-[8px] font-black uppercase tracking-[0.2em] px-3 py-[3px] rounded-full whitespace-nowrap shadow-md border border-[#C4956A]/30">
              masperron.vp
            </div>
          </motion.div>

          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-3.5"
          >
            <h1 className="text-[#FFF8F0] leading-[0.9] font-black text-center" style={{
              fontSize: 'clamp(1.4rem, 5vw, 2rem)',
              textShadow: '0 2px 8px rgba(42,21,8,0.35)',
              fontFamily: "'Georgia', 'Times New Roman', serif",
              letterSpacing: '0.02em'
            }}>
              MÁS PERRÓN
            </h1>
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-2 mb-1"
          >
            <h2 className="text-[#3E1F0D] text-sm font-black uppercase tracking-[0.08em] leading-tight" style={{
              fontFamily: "'Georgia', 'Times New Roman', serif"
            }}>
              TODO LO BUENO
            </h2>
            <p className="text-[#5C3520]/80 text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5">
              que tenemos para ti
            </p>
          </motion.div>
        </header>

        {/* ═══ MENÚ FRAME ═══ */}
        <div className="bg-[#F5E6D3]/40 backdrop-blur-sm rounded-3xl border border-[#C4956A]/25 p-4 mt-2" style={{
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.15), 0 8px 32px rgba(92,53,32,0.08)'
        }}>
          <div className="flex flex-col gap-7">
            {MENU_DATA.map((section, sectionIdx) => (
              <section key={section.category} id={section.id} className="flex flex-col gap-2.5 scroll-mt-6">
                <CategoryDivider>{section.category}</CategoryDivider>
                <div className="flex flex-col gap-2.5">
                  {section.items.map((item, i) => (
                    <MenuCard
                      key={item.id}
                      product={item}
                      onClick={() => openProduct(item)}
                      index={sectionIdx * 4 + i}
                      cartQuantity={getCartQuantity(item.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* ── CTA ESTÁTICO EN EL SCROLL ── */}
          <div className="mt-8 pt-5 border-t border-[#C4956A]/25 text-center pb-2">
            <h3 className="text-[#3E1F0D] text-base font-black uppercase tracking-wide">
              ¿Cuál vas a probar hoy? 🐾
            </h3>
            <p className="text-[#5C3520]/70 text-xs mt-1 leading-relaxed">
              Todo nuestro disponible!<br />
              Pide ya ❤️🐾
            </p>
          </div>
        </div>
      </div>

      {/* ═══ BARRA DE NAVEGACIÓN FIJA CON LAS 5 SECCIONES (Estética idéntica a la imagen) ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#F5E6D3] border-t-2 border-b-2 border-[#C4956A]/40 shadow-[0_-4px_25px_rgba(92,53,32,0.12)]">
        <div className="max-w-[420px] mx-auto px-2 py-2.5 flex justify-between items-center">
          {TRUST_BADGES.map((badge) => (
            <button
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className="flex flex-col items-center gap-1 flex-1 px-0.5 group active:scale-95 transition-transform"
            >
              <span className="text-base group-hover:scale-110 transition-transform">{badge.emoji}</span>
              <span className="text-[6.5px] text-[#5C3520] font-black uppercase text-center leading-[1.2] tracking-wide whitespace-pre-line group-hover:text-[#3E1F0D]">
                {badge.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ INTERACTIVOS ═══ */}
      <BottomSheet
        isOpen={isSheetOpen}
        product={selectedProduct}
        onClose={() => setIsSheetOpen(false)}
        onAddToCart={handleAddToCart}
      />
      <CartFooter cartItems={cartItems} />
    </div>
  );
};
