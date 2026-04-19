import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

export const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [form, setForm] = useState({ name: '', restaurant: '', email: '' });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    alert(`¡Gracias ${form.name}! Un experto de HUB se pondrá en contacto pronto para activar el piloto en ${form.restaurant}.`);
    setForm({ name: '', restaurant: '', email: '' });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-amber-500/30 overflow-x-hidden relative">
      
      {/* Dynamic Background Noise & Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% -20%, rgba(245, 158, 11, 0.15), transparent 60%)' }} />
      <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#050505]/90 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="HUB" className="h-6 object-contain invert" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">SaaS</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/superadmin')} className="text-[10px] uppercase tracking-widest text-white/50 hover:text-white transition-colors">Login Admin</button>
            <button onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })} className="hidden sm:block px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-[9px] uppercase tracking-widest font-bold transition-all">
              Agendar Demo
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20">
        {/* HERO SECTION */}
        <section className="max-w-5xl mx-auto px-6 text-center mt-12 mb-32">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-8 flex flex-col items-center">
            <motion.div variants={fadeIn} className="inline-block px-4 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] uppercase tracking-[0.2em] font-bold">
              Hub Operativo v2.0
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-sans font-light tracking-tighter text-white leading-tight">
              La última carta que tu <br className="hidden md:block"/>
              <span className="italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">restaurante necesitará.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="max-w-2xl text-white/50 md:text-lg tracking-wider font-light mx-auto leading-relaxed">
              Sustituye PDFs aburridos y mantenimientos costosos por un sistema interactivo 4D. Sube fotos de tu menú y la IA arma tu plataforma en 10 segundos.
            </motion.p>
            
            <motion.div variants={fadeIn} className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })} className="px-8 py-5 bg-amber-500 text-black font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                Empezar Piloto Gratis
              </button>
              <button onClick={() => document.getElementById('showcase').scrollIntoView({ behavior: 'smooth' })} className="px-8 py-5 bg-transparent border border-white/20 text-white font-bold uppercase tracking-widest text-xs rounded-full hover:bg-white/5 transition-colors">
                Ver Experiencia
              </button>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }} className="mt-20 relative mx-auto w-full max-w-4xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-amber-500/5 group">
             {/* Mock UI Showcase in Hero */}
             <div className="bg-[#111] p-4 flex gap-2 border-b border-white/5 items-center">
                <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/80"/><div className="w-3 h-3 rounded-full bg-yellow-500/80"/><div className="w-3 h-3 rounded-full bg-green-500/80"/></div>
                <div className="mx-auto bg-black/40 px-4 py-1 rounded-full text-[10px] text-white/30 font-mono">admin.hubsaas.com</div>
             </div>
             <div className="h-[400px] w-full bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center">
                 <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent"></div>
                 <div className="relative z-10 text-center space-y-4">
                    <span className="text-6xl group-hover:scale-110 transition-transform duration-500 block">✨</span>
                    <h3 className="text-xl tracking-widest uppercase font-black text-amber-500">Live Emulator Sync</h3>
                 </div>
             </div>
          </motion.div>
        </section>

        {/* SHOWCASE & EXPERIENCIA */}
        <section id="showcase" className="py-24 border-y border-white/5 bg-white/[0.02]">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
             <div className="space-y-6">
               <h2 className="text-3xl font-light tracking-tight">Menú Interactivo <span className="italic font-serif text-amber-500">4D</span></h2>
               <p className="text-white/50 leading-relaxed font-light">Elimina las fricciones de lectura con nuestra arquitectura única de navegación 3D orientada a dispositivos móviles. Los clientes "hojean" digitalmente tu carta sintiendo una respuesta inmersiva.</p>
               <ul className="space-y-4 text-sm font-light text-white/70">
                 <li className="flex items-center gap-3"><span className="text-amber-500">✦</span> 100% Web (Sin apps que descargar).</li>
                 <li className="flex items-center gap-3"><span className="text-amber-500">✦</span> Integración nativa con carrito al vuelo.</li>
                 <li className="flex items-center gap-3"><span className="text-amber-500">✦</span> Animación física real con inercia interactiva.</li>
               </ul>
             </div>
             <div className="relative">
                <div className="absolute -inset-4 bg-amber-500/10 blur-2xl rounded-full mix-blend-screen opacity-50"></div>
                <div className="bg-[#111] h-[500px] rounded-[3rem] border border-white/10 relative p-8 shadow-2xl flex flex-col items-center justify-center text-center overflow-hidden">
                    <motion.div animate={{ rotateY: [0, 15, -15, 0], scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} className="w-48 h-72 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-xl border border-white/20 shadow-2xl flex items-center justify-center">
                       <span className="text-5xl opacity-50">🍔</span>
                    </motion.div>
                    <p className="mt-8 text-[10px] uppercase tracking-widest text-amber-500 font-bold">Simulación 3D Viva</p>
                </div>
             </div>
          </div>
        </section>

        {/* ADMIN VIVA (IA & LIVE EMULATOR) */}
        <section className="py-32">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
             <div className="order-2 md:order-1 relative">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#111] border border-white/5 p-6 rounded-3xl space-y-4 flex flex-col justify-between">
                     <span className="text-3xl">🤖</span>
                     <h4 className="font-black text-sm uppercase tracking-widest">Ingesta IA</h4>
                     <p className="text-[10px] text-white/50 leading-relaxed">Sube el PDF de tu carta y el modelo lee la estructura, crea familias y extrae descripciones solas.</p>
                  </div>
                  <div className="bg-[#111] border border-white/5 p-6 rounded-3xl space-y-4 flex flex-col justify-between transform translate-y-8">
                     <span className="text-3xl">🪄</span>
                     <h4 className="font-black text-sm uppercase tracking-widest">Magic Edit</h4>
                     <p className="text-[10px] text-white/50 leading-relaxed">¿Descripciones aburridas? La IA aplica copywriting gastronómico para vender el doble.</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl space-y-4 flex flex-col justify-between col-span-2 mt-4">
                     <h4 className="font-black text-sm uppercase tracking-widest text-amber-500">Live Monitor</h4>
                     <p className="text-xs text-white/70 leading-relaxed">Todo el rastro de la clientela retransmitido en web-sockets. Ve qué items añaden más al carrito, analiza tendencias y maneja el inventario con toggle de 1-clic.</p>
                  </div>
                </div>
             </div>
             <div className="order-1 md:order-2 space-y-6">
               <h2 className="text-3xl font-light tracking-tight">
                 Actualizar menús era un <span className="italic font-serif text-amber-500">dolor de cabeza.</span>
               </h2>
               <p className="text-white/50 leading-relaxed font-light">
                 Se acabó el ciclo de depender de diseñadores, enviar a modificar el PDF y esperar días. Tomas tu móvil, entras a tu cuenta, habilitas/deshabilitas el producto y en menos de 200 milisegundos se refleja en cada mesa del restaurante.
               </p>
             </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="py-24 border-y border-white/5 bg-white/[0.01]">
          <div className="max-w-3xl mx-auto px-6 text-center space-y-12">
            <h2 className="text-4xl font-light tracking-tight">Trasparente, <span className="font-serif italic text-amber-500">SaaS</span> puro.</h2>
            
            <div className="bg-[#0a0a0a] border border-amber-500/30 rounded-[3rem] p-10 md:p-14 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 py-1.5 px-6 bg-amber-500 text-black text-[9px] font-black uppercase tracking-widest rounded-bl-2xl">Popular</div>
              
              <h3 className="text-2xl font-light">Licencia Full Access</h3>
              <div className="mt-4 mb-8">
                <span className="text-6xl font-black italic tracking-tighter">$35</span>
                <span className="text-white/40 uppercase tracking-widest text-xs ml-2">USD / mes</span>
              </div>
              
              <ul className="text-left space-y-4 text-sm font-light text-white/80 max-w-sm mx-auto mb-10">
                 <li className="flex gap-3"><span className="text-emerald-500">✔</span> Carga de menú automatizada (Ilimitada)</li>
                 <li className="flex gap-3"><span className="text-emerald-500">✔</span> Código QR Inteligente para Impresión</li>
                 <li className="flex gap-3"><span className="text-emerald-500">✔</span> Live Monitor y Analítica en Tiempo Real</li>
                 <li className="flex gap-3"><span className="text-emerald-500">✔</span> Personalización de colores y Redes (Branding)</li>
                 <li className="flex gap-3"><span className="text-emerald-500">✔</span> Edición "Magic Edit" (Gemini Pro)</li>
              </ul>
              
              <button onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-12 py-5 bg-amber-500 text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-full hover:brightness-110 shadow-[0_10px_30px_rgba(245,158,11,0.2)] transition-all">
                 Empezar Hoy
              </button>
            </div>
          </div>
        </section>

        {/* CONTACT / DEMO */}
        <section id="demo" className="py-32">
          <div className="max-w-xl mx-auto px-6 space-y-10">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-light tracking-tight">Agendar un <span className="font-serif italic text-amber-500">Piloto</span></h2>
              <p className="text-white/50 text-sm tracking-wider font-light">Completa tus datos y la magia de onboarding ocurrirá en horas. Sin compromisos atados.</p>
            </div>
            
            <form onSubmit={handleContactSubmit} className="space-y-4 p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
               <div className="space-y-1">
                 <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/50">Tu Nombre</label>
                 <input required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} type="text" className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition-colors" placeholder="Fernando..." />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/50">Nombre del Restaurante</label>
                 <input required value={form.restaurant} onChange={e=>setForm({...form, restaurant: e.target.value})} type="text" className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition-colors" placeholder="La Granja..." />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/50">Correo Electrónico</label>
                 <input required value={form.email} onChange={e=>setForm({...form, email: e.target.value})} type="email" className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition-colors" placeholder="hola@..." />
               </div>
               <div className="pt-4">
                 <button type="submit" className="w-full block text-center py-4 bg-white text-black text-[10px] uppercase tracking-[0.2em] font-black rounded-xl hover:bg-amber-500 transition-colors">
                   Solicitar Onboarding
                 </button>
               </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-white/5 text-center px-6">
        <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-white/30">
          © {new Date().getFullYear()} HUB SaaS. Todos los derechos reservados. Arquitectura construida para alto rendimiento.
        </p>
      </footer>
    </div>
  );
};
