import { motion } from 'framer-motion';

export const CoverPage = ({ onOpen }) => (
  <div
    className="cover-grain h-svh w-full flex items-center justify-center bg-black overflow-hidden relative"
    style={{ touchAction: 'none' }}
  >
    {/* Background video */}
    <video
      autoPlay muted loop playsInline
      className="absolute w-full h-full object-cover"
      style={{ opacity: 0.3, transform: 'scale(1.06)' }}
    >
      <source
        src="https://assets.mixkit.co/videos/preview/mixkit-fire-flames-in-the-dark-1234-large.mp4"
        type="video/mp4"
      />
    </video>

    {/* Gradient overlays */}
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/75 z-[1]" />
    <div className="absolute inset-0 z-[1]"
      style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(245,158,11,0.08) 0%, transparent 65%)' }}
    />

    {/* Ambient blobs */}
    <div className="ambient w-72 h-72 bg-amber-600 z-[1]"
      style={{ top: '15%', left: '10%' }} />
    <div className="ambient w-48 h-48 bg-orange-700 z-[1]"
      style={{ bottom: '20%', right: '10%', opacity: 0.08 }} />

    {/* 
      PORTADA — exit animation:
      Al abrir la carta, esta portada "gira" como la tapa de un libro,
      con transform-origin: left center para que el eje esté en el lomo.
    */}
    <motion.div
      exit={{
        rotateY: -120,   /* gira hacia la izquierda, como abrir un libro */
        x: -80,
        opacity: 0,
        transition: { duration: 1.1, ease: [0.4, 0, 0.2, 1] },
      }}
      style={{
        transformOrigin: 'left center', /* lomo del libro en el borde izquierdo */
        transformStyle: 'preserve-3d',
        willChange: 'transform, opacity',
      }}
      className="relative z-10 glass-card mx-5 rounded-[3rem] overflow-hidden"
    >
      {/* Inner shine */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.12) 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10 p-10 text-center">
        {/* Logo ring */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 180 }}
          className="w-20 h-20 rounded-full border flex items-center justify-center mx-auto mb-6"
          style={{
            borderColor: 'rgba(245,158,11,0.35)',
            background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
          }}
        >
          <span
            className="text-3xl font-black text-amber-400"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            R
          </span>
        </motion.div>

        {/* Name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7 }}
          className="text-4xl font-black text-white tracking-tighter uppercase leading-tight mb-1"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          LA RIVERA
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-amber-500 text-sm font-black uppercase tracking-[0.3em] mb-1"
        >
          Tech Gastro
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-slate-500 text-[10px] tracking-[0.35em] uppercase mb-8"
        >
          Valledupar, Cesar
        </motion.p>

        {/* Separator */}
        <div
          className="h-px mx-4 mb-8"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.5), transparent)' }}
        />

        {/* CTA button */}
        <motion.button
          id="abrir-carta-btn"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          whileTap={{ scale: 0.93 }}
          onClick={onOpen}
          className="w-full py-4 rounded-full font-black uppercase text-xs tracking-[0.22em] relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#050505',
            boxShadow: '0 8px 28px rgba(245,158,11,0.45)',
          }}
        >
          <span
            className="absolute inset-0 opacity-20"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.5), transparent)' }}
          />
          <span className="relative z-10">✦ Abrir Carta</span>
        </motion.button>
      </div>
    </motion.div>
  </div>
);
