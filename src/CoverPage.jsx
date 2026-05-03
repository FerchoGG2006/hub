import { motion } from 'framer-motion';

export const CoverPage = ({ onOpen, config }) => {
  const logoUrl = config?.logo_url;
  const brandName = config?.name || 'HUB RESTAURANT';

  return (
    <div className="min-h-svh w-full flex items-center justify-center bg-[#030303] relative overflow-hidden" style={{ touchAction: 'none' }}>
      
      {/* ── LUXURY AMBIENCE ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle animated light blooms */}
        <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} 
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[20%] -left-[20%] w-[70vw] h-[70vw] rounded-full bg-white/5 blur-[100px]" 
        />
        <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.2, 0.1] }} 
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -bottom-[20%] -right-[20%] w-[80vw] h-[80vw] rounded-full bg-white/5 blur-[120px]" 
        />
        {/* Paper / Leather Grain */}
        <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }} />
      </div>

      <motion.div
        exit={{ 
          rotateY: -110, 
          x: -150, 
          opacity: 0, 
          scale: 0.9,
          transition: { duration: 1.2, ease: [0.4, 0, 0.2, 1] } 
        }}
        style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
        className="relative z-10 w-full max-w-[360px] mx-6"
      >
        <div className="bg-white/[0.02] backdrop-blur-3xl p-12 text-center rounded-[3rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,1)] relative overflow-hidden group">
            
            {/* Inner Glare Effect */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

            {/* Logo Area */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-32 h-32 mx-auto mb-10 relative"
            >
              <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl" />
              {logoUrl ? (
                <img src={logoUrl} alt={brandName} className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" />
              ) : (
                <div className="w-full h-full rounded-full border border-white/20 flex items-center justify-center bg-black/50 relative z-10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">
                    <span className="text-5xl font-black text-white">{brandName[0]}</span>
                </div>
              )}
            </motion.div>

            {/* Typography */}
            <motion.h1 
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
                className="text-3xl font-black text-white tracking-tighter uppercase leading-none mb-3 drop-shadow-md"
            >
              {brandName}
            </motion.h1>
            
            <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }}
                className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mb-12"
            >
              Digital Experience
            </motion.p>

            {/* CTA Button */}
            <motion.button
              id="abrir-carta-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={onOpen}
              className="w-full py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] relative overflow-hidden group shadow-[0_20px_40px_rgba(255,255,255,0.1)] bg-white text-black transition-all hover:shadow-[0_20px_40px_rgba(255,255,255,0.2)] border border-white/50"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                 <span>✦</span> Descubrir
              </span>
              <div className="absolute inset-0 bg-black/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </motion.button>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} transition={{ delay: 1 }} className="absolute bottom-8 inset-x-0 text-center z-10 pointer-events-none">
         <p className="text-[9px] font-black uppercase tracking-[0.8em] text-white">Tech Gastro Hub</p>
      </motion.div>
    </div>
  );
};
