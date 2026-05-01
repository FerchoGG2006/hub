import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [form, setForm] = useState({ name: '', restaurant: '', email: '' });
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [welcomeModal, setWelcomeModal] = useState(null);

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

  /* ── UNIVERSAL LOGIN ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', loginData.username);
      formData.append('password', loginData.password);

      const res = await fetch(`${API_URL}/api/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      if (!res.ok) throw new Error('Credenciales inválidas');
      const data = await res.json();

      localStorage.setItem('hub_token', data.access_token);
      localStorage.setItem('hub_role', data.role);
      localStorage.setItem('hub_tenant', data.tenant_slug || '');

      // Route based on role
      if (data.role === 'superadmin') {
        navigate('/superadmin');
      } else if (data.tenant_slug) {
        navigate(`/admin/${data.tenant_slug}`);
      } else {
        navigate('/superadmin');
      }
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  /* ── ONBOARDING SUBMIT ── */
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    const slug = form.restaurant.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    console.log('Onboarding submitted for:', slug);
    
    // Show the welcome modal with access instructions
    setWelcomeModal({
      name: form.name,
      restaurant: form.restaurant,
      slug: slug,
      adminUrl: `${window.location.origin}/admin/${slug}`,
      menuUrl: `${window.location.origin}/${slug}`,
    });
    setForm({ name: '', restaurant: '', email: '' });
  };

  return (
    <div className="bg-bone text-dark font-sans selection:bg-amber-500/30 min-h-screen relative">
      
      {/* ─── AMBIENT BACKGROUND GLOWS ─── */}
      <div className="absolute top-0 inset-x-0 h-[800px] pointer-events-none opacity-40">
         <div className="absolute top-[-20%] left-[20%] w-[50vw] h-[50vw] rounded-full blur-[120px] mix-blend-multiply bg-gradient-to-r from-amber-500/10 to-orange-600/5"></div>
         <div className="absolute top-[10%] right-[10%] w-[30vw] h-[30vw] rounded-full blur-[100px] mix-blend-multiply bg-gradient-to-l from-amber-300/5 to-transparent"></div>
      </div>
      
      {/* ─── DOT MATRIX PATTERN ─── */}
      <div 
         className="absolute inset-0 pointer-events-none z-0" 
         style={{ backgroundImage: 'radial-gradient(rgba(26, 26, 26, 0.03) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      ></div>

      {/* ─── NAVIGATION ─── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-bone/80 backdrop-blur-2xl border-b border-dark/5 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <img src="/logo.png" alt="HUB" className="h-8 object-contain" />
          </div>
          <div className="flex items-center gap-4 md:gap-8">
            <button onClick={() => setShowLogin(true)} className="text-[10px] font-bold uppercase tracking-[0.2em] text-dark/50 hover:text-dark transition-colors">
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

      {/* ─── LOGIN MODAL ─── */}
      <AnimatePresence>
        {showLogin && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-bone/90 backdrop-blur-3xl flex items-center justify-center p-6"
            onClick={() => setShowLogin(false)}
          >
            <motion.div 
              initial={{ scale: 0.85, y: 40, rotateX: 10 }} 
              animate={{ scale: 1, y: 0, rotateX: 0 }} 
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="w-full max-w-sm bg-bone border border-dark/10 overflow-hidden shadow-2xl p-10"
              onClick={e => e.stopPropagation()}
            >
              {/* Animated Lock */}
              <div className="flex justify-center mb-8">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-2 border-dashed border-amber-500/30 rounded-full" />
                  <motion.div animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute inset-3 border border-white/10 rounded-full" />
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
              </div>

              <h3 className="text-center text-[10px] font-black uppercase tracking-[0.5em] text-amber-500 mb-1">Hub Operativo</h3>
              <p className="text-center text-[9px] uppercase tracking-[0.3em] text-dark/30 mb-8">Terminal de Acceso</p>

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <input 
                  type="text" placeholder="USER_ID" value={loginData.username}
                  onChange={e => setLoginData({...loginData, username: e.target.value})}
                  className="bg-transparent border-b border-dark/15 py-3 text-center text-dark tracking-[0.2em] outline-none focus:border-amber-500 transition-all font-mono text-sm"
                  autoFocus
                />
                <input 
                  type="password" placeholder="PASSCODE" value={loginData.password}
                  onChange={e => setLoginData({...loginData, password: e.target.value})}
                  className="bg-transparent border-b border-dark/15 py-3 text-center text-dark tracking-[0.5em] outline-none focus:border-amber-500 transition-all font-mono text-sm"
                />
                
                {loginError && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-[10px] text-center uppercase tracking-widest">
                    {loginError}
                  </motion.p>
                )}

                <button type="submit" disabled={loginLoading} className="mt-4 py-3.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-black uppercase text-[10px] font-black tracking-[0.3em] transition-all rounded-full disabled:opacity-40">
                  {loginLoading ? 'Verificando...' : 'Enlazar'}
                </button>
              </form>

              <button onClick={() => setShowLogin(false)} className="mt-6 w-full text-center text-[9px] uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors">
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ─── HERO SECTION ─── */}
      <main className="relative z-10">
        <section className="min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6 relative">
          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="text-center max-w-5xl mx-auto space-y-8 flex flex-col items-center">
            
            <motion.div 
               initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }}
               className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-dark/70">HUB Operativo v2.0 Live</span>
            </motion.div>
            
            <motion.h1 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
               className="text-6xl md:text-8xl font-sans tracking-tighter text-dark leading-[1.05]"
            >
              La Operativa Perfecta. <br className="hidden md:block"/>
              <span className="italic font-serif text-gold-gradient drop-shadow-sm">
                Sin intermediarios.
              </span>
            </motion.h1>
            
            <motion.p 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
               className="max-w-2xl text-dark/50 md:text-xl tracking-wide font-light mx-auto leading-relaxed"
            >
              Crea tu menú interactivo en 10 segundos impulsado por Inteligencia Artificial. Conviértelo en un modelo 4D físico-digital que tus usuarios aman hojear.
            </motion.p>

            <motion.div 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
               className="flex flex-col sm:flex-row gap-5 items-center mt-4"
            >
              <button 
                 onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })} 
                 className="px-10 py-5 rounded-full tactile-button text-bone font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 transition-all"
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
             <div className="absolute inset-0 bg-gradient-to-t from-bone via-transparent to-transparent z-20 pointer-events-none h-full"></div>
             <div className="bg-bone border border-dark/10 rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-[0_30px_100px_rgba(197,160,89,0.07)] overflow-hidden relative transition-all duration-700 hover:border-amber-500/30">
               
               {/* Terminal Top Bar */}
               <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4 px-2">
                 <div className="flex gap-2">
                   <div className="w-3 h-3 rounded-full bg-white/10"></div>
                   <div className="w-3 h-3 rounded-full bg-white/10"></div>
                   <div className="w-3 h-3 rounded-full bg-white/10"></div>
                 </div>
                 <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/5 flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-dark/10"></div>
                   <div className="w-3 h-3 rounded-full bg-dark/10"></div>
                   <div className="w-3 h-3 rounded-full bg-dark/10"></div>
                 </div>
                 <div className="bg-dark/5 px-4 py-1.5 rounded-full border border-dark/5 flex items-center gap-2">
                    <span className="text-[9px] uppercase font-mono text-dark/30 tracking-widest">hubsaas.com / admin / sync</span>
                 </div>
                 <div className="w-12"></div>
               </div>

               {/* Simulated Data Canvas */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                  <div className="h-64 rounded-2xl bg-dark/5 border border-dark/10 p-6 flex flex-col justify-end relative overflow-hidden group-hover:bg-dark/[0.08] transition-colors">
                     <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/10 blur-3xl rounded-full"></div>
                     <p className="text-4xl font-black italic tracking-tighter text-dark">$2,450</p>
                     <p className="text-[10px] uppercase font-bold tracking-widest text-amber-600 font-mono">LIVE_TRAFFIC_METRIC</p>
                  </div>
                  <div className="md:col-span-2 h-64 rounded-2xl bg-dark/5 border border-dark/10 p-6 flex flex-col justify-end relative overflow-hidden group-hover:bg-dark/[0.08] transition-colors">
                     <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none opacity-40">
                       <svg width="100%" height="100" viewBox="0 0 500 100" preserveAspectRatio="none">
                         <path d="M0 50 C 150 150, 350 -50, 500 50" fill="none" stroke="#f59e0b" strokeWidth="4" />
                       </svg>
                     </div>
                     <p className="text-xl font-light text-dark/40 tracking-wide z-10 max-w-sm">
                        "La conexión del socket retransmitió <span className="text-dark font-black font-mono">3,420</span> eventos táctiles al monitor del cajero."
                     </p>
                  </div>
               </div>
             </div>
          </motion.div>
        </section>

        {/* ─── BENTO BOX FEATURES ─── */}
        <section id="showcase" className="py-32 px-6 max-w-7xl mx-auto relative">
           <div className="text-center mb-20 space-y-4">
             <h2 className="text-4xl md:text-6xl font-light tracking-tighter">Una base de datos.<br/><span className="italic font-serif text-gold-gradient">Mil posibilidades.</span></h2>
             <p className="text-dark/40 tracking-widest uppercase text-[10px] font-bold">Arquitectura Unificada Multicanal</p>
           </div>

           <motion.div style={{ y: bentoY, opacity: bentoOpacity }} className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[280px]">
              
              {/* Feature 1 */}
              <div className="md:col-span-8 rounded-[2rem] bg-gradient-to-br from-dark/[0.03] to-dark/[0.01] border border-dark/[0.05] p-8 md:p-12 relative overflow-hidden group hover:border-amber-500/20 transition-all">
                <div className="absolute top-1/2 left-3/4 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]"></div>
                <div className="relative z-10 w-full md:w-2/3 flex flex-col h-full justify-center space-y-4">
                   <div className="w-12 h-12 rounded-full border border-dark/10 bg-dark/5 flex items-center justify-center text-xl mb-2">🤖</div>
                   <h3 className="text-2xl font-black uppercase tracking-tight">Ingesta 0-Click (AI Base)</h3>
                   <p className="text-sm font-light text-dark/50 leading-relaxed">Arrastra una foto chueca del menú antiguo en papel de tu cliente. Nuestro LLM lee la estructura, identifica familias, ajusta precios y genera el ecosistema en menos de 10 segundos.</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="md:col-span-4 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 p-8 md:p-12 relative overflow-hidden flex flex-col justify-between group hover:bg-amber-500/10 transition-all">
                <h3 className="text-xl font-medium tracking-tight text-amber-500">Magic Edit</h3>
                <div className="text-sm font-light text-dark/60 space-y-2">
                  <p className="line-through opacity-50">"Hamburguesa simple con queso."</p>
                  <p className="font-serif italic text-dark/90">"Jugosa carne Angus madurada, fundida en queso cheddar sobre pan brioche artesanal tostado a la mantequilla."</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="md:col-span-5 rounded-[2rem] bg-gradient-to-bl from-dark/[0.03] to-dark/[0.01] border border-dark/[0.05] p-8 md:p-12 flex flex-col justify-between group">
                <div className="flex justify-between items-start">
                   <h3 className="text-2xl font-black uppercase tracking-tight">Live Monitor</h3>
                   <div className="flex gap-1 h-3 mt-2">
                     <span className="w-1 bg-amber-500 rounded-full animate-[pulse_1s_ease-in-out_infinite]"></span>
                     <span className="w-1 bg-amber-500 rounded-full animate-[pulse_1.2s_ease-in-out_infinite]"></span>
                     <span className="w-1 bg-amber-500 rounded-full animate-[pulse_0.8s_ease-in-out_infinite]"></span>
                   </div>
                </div>
                <p className="text-sm font-light text-dark/50 leading-relaxed">No esperes al final del mes. Sabrás exactamente sobre qué ítem dudó el cliente y cuál añadió usando WebSockets ultra-rápidos.</p>
              </div>

              {/* Feature 4 */}
              <div className={`md:col-span-7 rounded-[2rem] bg-[url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="n"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23n)" opacity="0.05"/%3E%3C/svg%3E')] border border-dark/[0.05] p-8 md:p-12 relative overflow-hidden flex flex-col justify-end group hover:border-dark/20 transition-all`}>
                <div className="absolute -top-32 -right-10 text-[200px] opacity-[0.02] transform rotate-12 group-hover:rotate-6 transition-transform duration-1000">📖</div>
                <h3 className="text-3xl font-light tracking-tight mb-2">Motor Render <span className="font-serif italic text-gold-gradient">4D</span></h3>
                <p className="text-sm font-light text-dark/50 leading-relaxed max-w-sm">No es un PDF. Es un motor pseudo-físico que engaña al dedo imitando la fricción e inercia real del papel impreso usando matemática Framer y React.</p>
              </div>

           </motion.div>
        </section>

        {/* ─── PRICING ─── */}
        <section className="py-32 px-6 relative">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[500px] bg-amber-500/5 blur-[100px] rounded-full"></div>
          
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 relative z-10 bg-dark/[0.02] border border-dark/5 rounded-[3rem] p-10 md:p-16 backdrop-blur-2xl">
             <div className="flex-1 space-y-6">
                <h2 className="text-4xl font-light tracking-tight">Escalado simple. <br/><span className="text-gold-gradient font-serif italic">Un solo plan.</span></h2>
                <ul className="space-y-4 text-sm font-light text-dark/60">
                   <li className="flex items-center gap-3"><span className="text-amber-500 text-lg">✦</span> Plataforma Tenant Activa 24/7</li>
                   <li className="flex items-center gap-3"><span className="text-amber-500 text-lg">✦</span> Actualizaciones AI Inlimitadas</li>
                   <li className="flex items-center gap-3"><span className="text-amber-500 text-lg">✦</span> Soporte 1-Clic Auto-Gestionado</li>
                   <li className="flex items-center gap-3"><span className="text-amber-500 text-lg">✦</span> Kit Físico (PDF) Dinámico QR</li>
                </ul>
             </div>
             
             <div className="w-full md:w-[320px] bg-bone border border-dark/10 rounded-[2rem] p-8 shadow-[0_30px_60px_rgba(197,160,89,0.1)] relative group hover:-translate-y-2 transition-transform duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 text-center space-y-8">
                  <div className="inline-block px-4 py-1.5 rounded-full bg-dark/10 text-dark text-[9px] font-bold tracking-widest uppercase">
                    Full Access License
                  </div>
                  <div>
                    <p className="text-6xl font-black italic tracking-tighter text-dark">$35</p>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-dark/40 mt-2">Dólares / Mensual</p>
                  </div>
                  <button onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })} className="w-full py-4 text-bone bg-amber-500 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(245,158,11,0.3)] hover:brightness-110">
                    Abrir Tenant Ahora
                  </button>
                </div>
             </div>
          </div>
        </section>

        {/* ─── ONBOARDING CAPTURE (AI Engine Start) ─── */}
        <section id="demo" className="py-24 px-6 border-t border-dark/5 relative bg-bone">
          <div className="max-w-xl mx-auto text-center space-y-12">
             <div className="space-y-4">
               <h2 className="text-3xl md:text-5xl font-sans tracking-tight">
                 Estás a un formulario <br/>de la <span className="font-serif italic text-gold-gradient">era digital</span>.
               </h2>
               <p className="text-sm text-dark/50 font-light mx-auto max-w-sm leading-relaxed">
                 Pruébalo gratis. Llena los datos y activaremos tu cuenta maestra en nuestro hub en cuestión de minutos.
               </p>
             </div>
             
             <form onSubmit={handleContactSubmit} className="text-left space-y-3">
               <div className="bg-dark/[0.02] border border-dark/5 rounded-3xl p-2 flex flex-col md:flex-row gap-2">
                 <input 
                   required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} 
                   type="text" placeholder="Tu Nombre completo" 
                   className="flex-1 bg-transparent px-6 py-4 text-sm text-dark outline-none placeholder-dark/30" 
                 />
               </div>
               <div className="bg-dark/[0.02] border border-dark/5 rounded-3xl p-2 flex flex-col md:flex-row gap-2">
                 <div className="flex-1 flex flex-col sm:flex-row gap-2 border-b sm:border-b-0 sm:border-r border-dark/5">
                   <input 
                     required value={form.restaurant} onChange={e=>setForm({...form, restaurant: e.target.value})} 
                     type="text" placeholder="Restaurante" 
                     className="flex-1 bg-transparent px-6 py-4 text-sm text-dark outline-none placeholder-dark/30" 
                   />
                 </div>
                 <div className="flex-1">
                   <input 
                     required value={form.email} onChange={e=>setForm({...form, email: e.target.value})} 
                     type="email" placeholder="Correo de Contacto" 
                     className="w-full bg-transparent px-6 py-4 text-sm text-dark outline-none placeholder-dark/30" 
                   />
                 </div>
               </div>
               <div className="pt-4">
                 <button type="submit" className="w-full py-5 rounded-2xl border border-dark/20 bg-dark text-bone font-black uppercase tracking-[0.2em] text-[10px] hover:bg-amber-500 hover:border-amber-500 transition-colors shadow-2xl">
                   Arrancar Operaciones Hoy
                 </button>
               </div>
             </form>
          </div>
        </section>

      </main>

      {/* ─── FOOTER ─── */}
      <footer className="py-12 border-t border-dark/5 text-center px-6 relative z-10 bg-bone">
        <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-dark/30">
          © {new Date().getFullYear()} HUB SaaS. Infraestructura Dinámica.
        </p>
      </footer>

      {/* ─── WELCOME MODAL (post-registration) ─── */}
      <AnimatePresence>
        {welcomeModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-bone/90 backdrop-blur-3xl flex items-center justify-center p-6"
            onClick={() => setWelcomeModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.85, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-bone border border-dark/10 overflow-hidden shadow-2xl p-10"
              onClick={e => e.stopPropagation()}
            >
              {/* Success Animation */}
              <div className="flex justify-center mb-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <span className="text-3xl">🚀</span>
                </motion.div>
              </div>

              <h3 className="text-center text-2xl font-black text-dark tracking-tighter italic uppercase mb-2">¡BIEVENIDO, {welcomeModal.name.toUpperCase()}!</h3>
              <p className="text-center text-[10px] text-dark/40 font-bold uppercase tracking-[0.2em] mb-8">Tu hub <span className="text-amber-600">{welcomeModal.restaurant}</span> está listo para el despliegue.</p>

              {/* Access Info Cards */}
              <div className="space-y-4 mb-8">
                <div className="bg-dark/5 border border-dark/10 rounded-2xl p-6">
                  <p className="text-[9px] uppercase tracking-[0.4em] text-amber-600 font-black mb-3 font-mono">🔗 HUB_ADMIN_PORTAL</p>
                  <p className="text-xs text-dark font-mono break-all select-all bg-bone px-4 py-3 rounded-xl border border-dark/10 shadow-sm">{welcomeModal.adminUrl}</p>
                </div>

                <div className="bg-dark/5 border border-dark/10 rounded-2xl p-6">
                  <p className="text-[9px] uppercase tracking-[0.4em] text-emerald-600 font-black mb-3 font-mono">📱 DIGITAL_ECOSYSTEM</p>
                  <p className="text-xs text-dark font-mono break-all select-all bg-bone px-4 py-3 rounded-xl border border-dark/10 shadow-sm">{welcomeModal.menuUrl}</p>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6">
                  <p className="text-[9px] uppercase tracking-[0.4em] text-amber-600 font-black mb-3 font-mono">📧 CREDENTIALS_SENT</p>
                  <p className="text-[10px] text-dark/60 leading-relaxed font-bold uppercase">Recibirás tu <span className="text-dark">USER_ID</span> y <span className="text-dark">PASSCODE</span> encriptados una vez activemos tu nodo maestro.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => { navigator.clipboard.writeText(welcomeModal.adminUrl); }}
                  className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-dark/10 text-dark/40 hover:text-dark hover:bg-dark/5 transition-all"
                >
                  Copiar URL
                </button>
                <button 
                  onClick={() => setWelcomeModal(null)}
                  className="flex-1 py-4 bg-dark text-bone rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all tactile-button shadow-xl"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
