import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const InstagramAutopilot = () => {
  const { tenantSlug } = useParams();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ig_account_id: '',
    short_token: '',
    opening_time: '11:00',
    closing_time: '22:00',
    branch_id: 1 // Default
  });
  
  // Animation state for the mobile mock
  const [simulatedTime, setSimulatedTime] = useState('08:00');
  const [bioStatus, setBioStatus] = useState('CLOSED');

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        setSimulatedTime(prev => {
           if(prev === '08:00') {
               setBioStatus('OPEN');
               return '11:00';
           }
           if(prev === '11:00') {
               setBioStatus('CLOSED');
               return '22:00';
           }
           if(prev === '22:00') {
               setBioStatus('CLOSED');
               return '08:00';
           }
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!formData.ig_account_id || !formData.short_token) {
        // Just simulate connection for the WOW effect if empty fields
        setIsConnected(true);
        return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/instagram/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Fallo la conexión con Instagram");
      setIsConnected(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <header className="mb-8 border-b border-white/10 pb-6">
        <h2 className="text-3xl font-light text-white mb-2 tracking-tight">
          Piloto Automático <span className="text-pink-500 font-serif italic">Meta</span>
        </h2>
        <p className="text-[10px] uppercase tracking-widest text-white/40">Sincroniza tus horarios de atención con tu biografía de Instagram</p>
      </header>

      {!isConnected ? (
        <div className="bg-white/[0.03] p-8 rounded-[2.5rem] border border-white/5 space-y-8 flex flex-col items-center max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(236,72,153,0.3)]">
               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </div>
            
            <div>
               <h3 className="text-2xl font-black text-white mb-4">La llave maestra para vender mientras duermes.</h3>
               <p className="text-sm text-white/50 leading-relaxed mb-8">Conecta tu cuenta de Instagram y HUB cambiará automáticamente tu estado a 'Abierto' o 'Cerrado' según tus horarios, colocando el enlace correcto a tu menú digital sin mover un dedo.</p>
            </div>

            <form onSubmit={handleConnect} className="w-full space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/50">IG Account ID</label>
                    <input type="text" value={formData.ig_account_id} onChange={(e) => setFormData({...formData, ig_account_id: e.target.value})} className="bg-black border border-white/10 rounded-2xl py-3 px-4 text-xs focus:border-pink-500 outline-none" placeholder="123456789" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/50">Short-Lived Token</label>
                    <input type="text" value={formData.short_token} onChange={(e) => setFormData({...formData, short_token: e.target.value})} className="bg-black border border-white/10 rounded-2xl py-3 px-4 text-xs focus:border-pink-500 outline-none" placeholder="EAABw..." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/50">Hora de Apertura</label>
                    <input type="time" value={formData.opening_time} onChange={(e) => setFormData({...formData, opening_time: e.target.value})} className="bg-black border border-white/10 rounded-2xl py-3 px-4 text-xs focus:border-pink-500 outline-none text-white" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/50">Hora de Cierre</label>
                    <input type="time" value={formData.closing_time} onChange={(e) => setFormData({...formData, closing_time: e.target.value})} className="bg-black border border-white/10 rounded-2xl py-3 px-4 text-xs focus:border-pink-500 outline-none text-white" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-4 mt-4 text-[12px] uppercase tracking-[0.2em] font-black text-white rounded-[2rem] hover:scale-[1.02] transition-transform shadow-[0_10px_30px_rgba(236,72,153,0.3)] bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center gap-3">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                   {loading ? 'Conectando...' : 'Activar Piloto Automático de Ventas'}
                </button>
            </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto pt-8">
            {/* Timeline */}
            <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/20 before:to-transparent">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/50 bg-black text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <span className="text-[10px] text-white">08 AM</span>
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-1">
                            <div className="font-bold text-white text-sm">Cerrados por ahora</div>
                            <div className="text-pink-500 text-xs flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span> Auto</div>
                        </div>
                        <div className="text-white/50 text-xs">El sistema actualiza la biografía indicando que el local está cerrado y muestra el menú para programar pedidos.</div>
                    </div>
                </motion.div>
                
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-pink-500 bg-black text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_15px_rgba(236,72,153,0.5)]">
                        <span className="text-[10px] text-white">11 AM</span>
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-1">
                            <div className="font-bold text-white text-sm">¡Apertura Automática!</div>
                            <div className="text-emerald-500 text-xs flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live</div>
                        </div>
                        <div className="text-white/50 text-xs">La biografía cambia dinámicamente llamando a la acción e insertando el Link exacto de pedidos.</div>
                    </div>
                </motion.div>
                
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/50 bg-black text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <span className="text-[10px] text-white">10 PM</span>
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-1">
                            <div className="font-bold text-white text-sm">Cierre de Jornada</div>
                            <div className="text-pink-500 text-xs flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500"></span> Auto</div>
                        </div>
                        <div className="text-white/50 text-xs">Vuelve al estado inactivo evitando pedidos fantasmas.</div>
                    </div>
                </motion.div>
            </div>

            {/* Mobile Mockup */}
            <div className="flex justify-center relative">
                <div className="w-[280px] h-[580px] bg-black border-[6px] border-zinc-800 rounded-[3rem] overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 inset-x-0 h-6 bg-zinc-800 rounded-b-3xl w-1/2 mx-auto z-20"></div>
                    
                    <div className="pt-12 px-4 pb-4 h-full bg-[#0a0a0a] flex flex-col">
                       {/* Header IG */}
                       <div className="flex justify-between items-center mb-6">
                          <span className="text-white font-bold tracking-tight">@{tenantSlug || 'restaurante'}</span>
                          <span className="text-white text-xs">{simulatedTime} AM</span>
                       </div>
                       
                       {/* Profile Info */}
                       <div className="flex items-center gap-4 mb-6">
                          <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-pink-500 p-0.5">
                             <div className="w-full h-full rounded-full bg-zinc-700"></div>
                          </div>
                          <div className="flex gap-4">
                             <div className="text-center"><div className="text-white font-bold">120</div><div className="text-white/50 text-[10px]">Posts</div></div>
                             <div className="text-center"><div className="text-white font-bold">10.5k</div><div className="text-white/50 text-[10px]">Followers</div></div>
                             <div className="text-center"><div className="text-white font-bold">45</div><div className="text-white/50 text-[10px]">Following</div></div>
                          </div>
                       </div>
                       
                       {/* Dynamic Bio */}
                       <div className="mb-4 text-sm relative h-[100px]">
                          <AnimatePresence mode="wait">
                            {bioStatus === 'OPEN' ? (
                                <motion.div key="open" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-white">
                                    <p>✅ ¡Abiertos en tu sede favorita!</p>
                                    <p>🍔 Las mejores hamburguesas de la ciudad.</p>
                                    <p className="mt-2">🚀 Pide sin filas aquí 👇</p>
                                    <p className="text-blue-400">hub.com/{tenantSlug || 'restaurante'}</p>
                                </motion.div>
                            ) : (
                                <motion.div key="closed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-white/70">
                                    <p>💤 Cerrados por ahora.</p>
                                    <p>🍔 Las mejores hamburguesas de la ciudad.</p>
                                    <p className="mt-2">📅 Mira el menú y programa para mañana:</p>
                                    <p className="text-blue-400">hub.com/{tenantSlug || 'restaurante'}</p>
                                </motion.div>
                            )}
                          </AnimatePresence>
                       </div>
                       
                       <div className="flex gap-2 mb-6">
                           <div className="flex-1 py-1.5 bg-white/10 rounded-lg text-center text-white text-xs font-bold">Follow</div>
                           <div className="flex-1 py-1.5 bg-white/10 rounded-lg text-center text-white text-xs font-bold">Message</div>
                       </div>

                       {/* Posts grid mock */}
                       <div className="grid grid-cols-3 gap-1">
                           {[1,2,3,4,5,6,7,8,9].map(i => (
                               <div key={i} className="aspect-square bg-zinc-800"></div>
                           ))}
                       </div>
                    </div>
                </div>
                
                {/* Floating tooltip */}
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1 }} className="absolute -right-12 top-1/2 bg-amber-500 text-black text-[10px] font-black uppercase px-3 py-2 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.5)] transform -rotate-6">
                    Live Demo
                </motion.div>
            </div>
        </div>
      )}
    </motion.div>
  );
};
