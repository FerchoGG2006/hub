// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

export const CoverPage = ({ onOpen, config }) => (
  <div className="cover-grain min-h-svh w-full flex items-center justify-center bg-black relative overflow-hidden">
    {/* Cinematic Background */}
    <video autoPlay muted loop playsInline className="absolute w-full h-full object-cover" style={{ opacity: 0.2, transform: 'scale(1.1)' }}>
      <source src="https://assets.mixkit.co/videos/preview/mixkit-fire-flames-in-the-dark-1234-large.mp4" type="video/mp4" />
    </video>
    
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80 z-[1]" />
    
    {/* Ambient Glows (Fixed with Radial Gradients) */}
    <div className="absolute top-[10%] left-[-10%] w-[80vw] h-[80vw] z-[1] opacity-30 pointer-events-none" 
         style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 70%)' }} />
    <div className="absolute bottom-[0%] right-[-10%] w-[60vw] h-[60vw] z-[1] opacity-20 pointer-events-none" 
         style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)' }} />

    <motion.div
      exit={{ 
        rotateY: -110, 
        x: -150, 
        opacity: 0, 
        transition: { duration: 1.2, ease: [0.4, 0, 0.2, 1] } 
      }}
      style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
      className="relative z-10 glass-card mx-6 w-full max-w-[340px] rounded-[3.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.1) 0%, transparent 60%)' }} />
      
      <div className="relative z-10 p-12 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 100 }}
          className="w-24 h-24 rounded-full border-2 flex items-center justify-center mx-auto mb-8 shadow-2xl"
          style={{ borderColor: 'rgba(245,158,11,0.4)', background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 80%)' }}
        >
          <span className="text-4xl font-black text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
            {config?.name?.[0] || 'R'}
          </span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-2">
          {config?.name || 'LA RIVERA'}
        </motion.h1>
        
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-amber-500 text-[11px] font-black uppercase tracking-[0.4em] mb-2">
          Tech Gastro Hub
        </motion.p>
        
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="text-white/20 text-[9px] tracking-[0.2em] uppercase mb-10">
          Valledupar, Cesar
        </motion.p>

        <div className="h-px w-full mb-10 opacity-30" style={{ background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)' }} />

        <motion.button
          id="abrir-carta-btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpen}
          className="w-full py-5 rounded-3xl font-black uppercase text-[11px] tracking-[0.3em] relative overflow-hidden group"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', boxShadow: '0 15px 40px rgba(245,158,11,0.4)' }}
        >
          <span className="relative z-10">✦ Abrir Carta</span>
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        </motion.button>
      </div>
    </motion.div>

    {/* Branding HUD */}
    <div className="absolute bottom-10 inset-x-0 text-center z-10 pointer-events-none opacity-20">
       <p className="text-[8px] font-black uppercase tracking-[1em] text-white">Interactive Experience v2.0</p>
    </div>
  </div>
);
