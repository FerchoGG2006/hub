import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [form, setForm] = useState({ name: '', restaurant: '', email: '' });

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  
  const bentoY = useTransform(scrollYProgress, [0.1, 0.3], [100, 0]);
  const bentoOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    alert(`¡Wow ${form.name}! El futuro ha llegado a ${form.restaurant}. Te contactaremos de inmediato.`);
    setForm({ name: '', restaurant: '', email: '' });
  };

  return (
    <div className="bg-[#020202] text-white font-sans selection:bg-amber-500/30 overflow-x-hidden min-h-screen relative">
      
      {/* ─── AMBIENT BACKGROUND GLOWS ─── */}
      <div className="absolute top-0 inset-x-0 h-[800px] pointer-events-none opacity-40">
         <div className="absolute top-[-20%] left-[20%] w-[50vw] h-[50vw] rounded-full blur-[120px] mix-blend-screen bg-gradient-to-r from-amber-500/20 to-orange-600/10"></div>
         <div className="absolute top-[10%] right-[10%] w-[30vw] h-[30vw] rounded-full blur-[100px] mix-blend-screen bg-gradient-to-l from-amber-300/10 to-transparent"></div>
      </div>
      
      {/* ─── DOT MATRIX PATTERN ─── */}
      <div 
         className="absolute inset-0 pointer-events-none z-0" 
         style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      ></div>

      {/* ─── NAVIGATION ─── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-[#020202]/80 backdrop-blur-2xl border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <img src="/logo.png" alt="HUB" className="h-8 object-contain" />
             <span className="text-lg font-black tracking-tighter">HUB<span className="font-light opacity-50 ml-1">SaaS</span></span>
          </div>
          <div className="flex items-center gap-8">
            <button onClick={() => navigate('/superadmin')} className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors hidden md:block">
               Acceso Admin
            </button>
            <button 
               onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })} 
               className="relative overflow-hidden group px-6 py-2.5 rounded-full border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all"
            >
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 relative z-10 transition-colors group-hover:text-amber-400">Agendar Piloto</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <main className="relative z-10">
        <section className="min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6 relative">
          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="text-center max-w-5xl mx-auto space-y-8 flex flex-col items-center">
            
            <motion.div 
               initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }}
               className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-white/70">HUB Operativo v2.0 Live</span>
            </motion.div>
            
            <motion.h1 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
               className="text-6xl md:text-8xl font-sans tracking-tighter text-white leading-[1.05]"
            >
              La Operativa Perfecta. <br className="hidden md:block"/>
              <span className="italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-500 to-orange-500 drop-shadow-sm">
                Sin intermediarios.
              </span>
            </motion.h1>
            
            <motion.p 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
               className="max-w-2xl text-white/50 md:text-xl tracking-wide font-light mx-auto leading-relaxed"
            >
              Crea tu menú interactivo en 10 segundos impulsado por Inteligencia Artificial. Conviértelo en un modelo 4D físico-digital que tus usuarios aman hojear.
            </motion.p>

            <motion.div 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
               className="flex flex-col sm:flex-row gap-5 items-center mt-4"
            >
              <button 
                 onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })} 
                 className="px-10 py-5 rounded-full bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              >
                Comenzar Gratis (IA)
              </button>
              <button 
                 onClick={() => document.getElementById('showcase').scrollIntoView({ behavior: 'smooth' })} 
                 className="flex items-center gap-3 text-white/50 hover:text-white transition-colors"
              >
                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-[10px]">↓</div>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Explorar Magia</span>
              </button>
            </motion.div>
          </motion.div>

          {/* FLUID INTERFACE MOCKUP */}
          <motion.div 
            initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-6xl mt-24 relative z-20 group"
          >
             <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-transparent z-20 pointer-events-none h-full"></div>
             <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-[0_30px_100px_rgba(245,158,11,0.07)] overflow-hidden relative transition-all duration-700 hover:border-amber-500/30">
               
               {/* Terminal Top Bar */}
               <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4 px-2">
                 <div className="flex gap-2">
                   <div className="w-3 h-3 rounded-full bg-white/10"></div>
                   <div className="w-3 h-3 rounded-full bg-white/10"></div>
                   <div className="w-3 h-3 rounded-full bg-white/10"></div>
                 </div>
                 <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/5 flex items-center gap-2">
                    <span className="text-[9px] uppercase font-mono text-white/30 tracking-widest">hubsaas.com / admin / sync</span>
                 </div>
                 <div className="w-12"></div>
               </div>

               {/* Simulated Data Canvas */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                  <div className="h-64 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.05] p-6 flex flex-col justify-end relative overflow-hidden group-hover:bg-white/[0.04]">
                     <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/20 blur-3xl rounded-full"></div>
                     <p className="text-3xl font-black italic tracking-tighter text-white/90">$2,450</p>
                     <p className="text-[10px] uppercase font-bold tracking-widest text-amber-500">Live Traffic Metric</p>
                  </div>
                  <div className="md:col-span-2 h-64 rounded-2xl bg-gradient-to-bl from-white/[0.03] to-transparent border border-white/[0.05] p-6 flex flex-col justify-end relative overflow-hidden group-hover:bg-white/[0.04]">
                     <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none opacity-20">
                       <svg width="100%" height="100" viewBox="0 0 500 100" preserveAspectRatio="none">
                         <path d="M0 50 C 150 150, 350 -50, 500 50" fill="none" stroke="#f59e0b" strokeWidth="4" />
                       </svg>
                     </div>
                     <p className="text-xl font-light text-white/50 tracking-wide z-10 max-w-sm">
                        "La conexión del socket retransmitió 3,420 eventos táctiles al monitor del cajero."
                     </p>
                  </div>
               </div>
             </div>
          </motion.div>
        </section>

        {/* ─── BENTO BOX FEATURES ─── */}
        <section id="showcase" className="py-32 px-6 max-w-7xl mx-auto relative">
           <div className="text-center mb-20 space-y-4">
             <h2 className="text-4xl md:text-6xl font-light tracking-tighter">Una base de datos.<br/><span className="italic font-serif text-amber-500">Mil posibilidades.</span></h2>
             <p className="text-white/40 tracking-widest uppercase text-[10px] font-bold">Arquitectura Unificada Multicanal</p>
           </div>

           <motion.div style={{ y: bentoY, opacity: bentoOpacity }} className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[280px]">
              
              {/* Feature 1 */}
              <div className="md:col-span-8 rounded-[2rem] bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.05] p-8 md:p-12 relative overflow-hidden group hover:border-amber-500/20 transition-all">
                <div className="absolute top-1/2 left-3/4 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]"></div>
                <div className="relative z-10 w-full md:w-2/3 flex flex-col h-full justify-center space-y-4">
                   <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-xl mb-2">🤖</div>
                   <h3 className="text-2xl font-black uppercase tracking-tight">Ingesta 0-Click (AI Base)</h3>
                   <p className="text-sm font-light text-white/50 leading-relaxed">Arrastra una foto chueca del menú antiguo en papel de tu cliente. Nuestro LLM lee la estructura, identifica familias, ajusta precios y genera el ecosistema en menos de 10 segundos.</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="md:col-span-4 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 p-8 md:p-12 relative overflow-hidden flex flex-col justify-between group hover:bg-amber-500/10 transition-all">
                <h3 className="text-xl font-medium tracking-tight text-amber-500">Magic Edit</h3>
                <div className="text-sm font-light text-white/60 space-y-2">
                  <p className="line-through opacity-50">"Hamburguesa simple con queso."</p>
                  <p className="font-serif italic text-white/90">"Jugosa carne Angus madurada, fundida en queso cheddar sobre pan brioche artesanal tostado a la mantequilla."</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="md:col-span-5 rounded-[2rem] bg-gradient-to-bl from-white/[0.03] to-white/[0.01] border border-white/[0.05] p-8 md:p-12 flex flex-col justify-between group">
                <div className="flex justify-between items-start">
                   <h3 className="text-2xl font-black uppercase tracking-tight">Live Monitor</h3>
                   <div className="flex gap-1 h-3 mt-2">
                     <span className="w-1 bg-amber-500 rounded-full animate-[pulse_1s_ease-in-out_infinite]"></span>
                     <span className="w-1 bg-amber-500 rounded-full animate-[pulse_1.2s_ease-in-out_infinite]"></span>
                     <span className="w-1 bg-amber-500 rounded-full animate-[pulse_0.8s_ease-in-out_infinite]"></span>
                   </div>
                </div>
                <p className="text-sm font-light text-white/50 leading-relaxed">No esperes al final del mes. Sabrás exactamente sobre qué ítem dudó el cliente y cuál añadió usando WebSockets ultra-rápidos.</p>
              </div>

              {/* Feature 4 */}
              <div className={`md:col-span-7 rounded-[2rem] bg-[url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="n"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23n)" opacity="0.05"/%3E%3C/svg%3E')] border border-white/[0.05] p-8 md:p-12 relative overflow-hidden flex flex-col justify-end group hover:border-white/20 transition-all`}>
                <div className="absolute -top-32 -right-10 text-[200px] opacity-[0.02] transform rotate-12 group-hover:rotate-6 transition-transform duration-1000">📖</div>
                <h3 className="text-3xl font-light tracking-tight mb-2">Motor Render <span className="font-serif italic text-amber-500">4D</span></h3>
                <p className="text-sm font-light text-white/50 leading-relaxed max-w-sm">No es un PDF. Es un motor pseudo-físico que engaña al dedo imitando la fricción e inercia real del papel impreso usando matemática Framer y React.</p>
              </div>

           </motion.div>
        </section>

        {/* ─── PRICING ─── */}
        <section className="py-32 px-6 relative">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[500px] bg-amber-500/5 blur-[100px] rounded-full"></div>
          
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 relative z-10 bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 md:p-16 backdrop-blur-2xl">
             <div className="flex-1 space-y-6">
                <h2 className="text-4xl font-light tracking-tight">Escalado simple. <br/><span className="text-amber-500 font-serif italic">Un solo plan.</span></h2>
                <ul className="space-y-4 text-sm font-light text-white/60">
                   <li className="flex items-center gap-3"><span className="text-amber-500 text-lg">✦</span> Plataforma Tenant Activa 24/7</li>
                   <li className="flex items-center gap-3"><span className="text-amber-500 text-lg">✦</span> Actualizaciones AI Inlimitadas</li>
                   <li className="flex items-center gap-3"><span className="text-amber-500 text-lg">✦</span> Soporte 1-Clic Auto-Gestionado</li>
                   <li className="flex items-center gap-3"><span className="text-amber-500 text-lg">✦</span> Kit Físico (PDF) Dinámico QR</li>
                </ul>
             </div>
             
             <div className="w-full md:w-[320px] bg-[#000] border border-white/10 rounded-[2rem] p-8 shadow-[0_30px_60px_rgba(245,158,11,0.1)] relative group hover:-translate-y-2 transition-transform duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 text-center space-y-8">
                  <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white text-[9px] font-bold tracking-widest uppercase">
                    Full Access License
                  </div>
                  <div>
                    <p className="text-6xl font-black italic tracking-tighter text-white">$35</p>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-white/40 mt-2">Dólares / Mensual</p>
                  </div>
                  <button onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })} className="w-full py-4 text-black bg-amber-500 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(245,158,11,0.3)] hover:brightness-110">
                    Abrir Tenant Ahora
                  </button>
                </div>
             </div>
          </div>
        </section>

        {/* ─── ONBOARDING CAPTURE (AI Engine Start) ─── */}
        <section id="demo" className="py-24 px-6 border-t border-white/5 relative bg-[#020202]">
          <div className="max-w-xl mx-auto text-center space-y-12">
             <div className="space-y-4">
               <h2 className="text-3xl md:text-5xl font-sans tracking-tight">
                 Estás a un formulario <br/>de la <span className="font-serif italic text-amber-500">era digital</span>.
               </h2>
               <p className="text-sm text-white/50 font-light mx-auto max-w-sm leading-relaxed">
                 Pruébalo gratis. Llena los datos y activaremos tu cuenta maestra en nuestro hub en cuestión de minutos.
               </p>
             </div>
             
             <form onSubmit={handleContactSubmit} className="text-left space-y-3">
               <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-2 flex flex-col md:flex-row gap-2">
                 <input 
                   required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} 
                   type="text" placeholder="Tu Nombre completo" 
                   className="flex-1 bg-transparent px-6 py-4 text-sm text-white outline-none placeholder-white/30" 
                 />
               </div>
               <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-2 flex flex-col md:flex-row gap-2">
                 <div className="flex-1 flex flex-col sm:flex-row gap-2 border-b sm:border-b-0 sm:border-r border-white/5">
                   <input 
                     required value={form.restaurant} onChange={e=>setForm({...form, restaurant: e.target.value})} 
                     type="text" placeholder="Restaurante" 
                     className="flex-1 bg-transparent px-6 py-4 text-sm text-white outline-none placeholder-white/30" 
                   />
                 </div>
                 <div className="flex-1">
                   <input 
                     required value={form.email} onChange={e=>setForm({...form, email: e.target.value})} 
                     type="email" placeholder="Correo de Contacto" 
                     className="w-full bg-transparent px-6 py-4 text-sm text-white outline-none placeholder-white/30" 
                   />
                 </div>
               </div>
               <div className="pt-4">
                 <button type="submit" className="w-full py-5 rounded-2xl border border-white/20 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] hover:bg-amber-500 hover:border-amber-500 transition-colors shadow-2xl">
                   Arrancar Operaciones Hoy
                 </button>
               </div>
             </form>
          </div>
        </section>

      </main>

      {/* ─── FOOTER ─── */}
      <footer className="py-12 border-t border-white/5 text-center px-6 relative z-10 bg-[#020202]">
        <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-white/30">
          © {new Date().getFullYear()} HUB SaaS. Infraestructura Dinámica.
        </p>
      </footer>
    </div>
  );
};
