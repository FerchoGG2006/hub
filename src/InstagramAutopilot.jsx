import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const FB_APP_ID = import.meta.env.VITE_FB_APP_ID || '1064126132049987';

export const InstagramAutopilot = () => {
  const { tenantSlug } = useParams();
  const [isLinked, setIsLinked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [syncAll, setSyncAll] = useState(true);
  const [globalHours, setGlobalHours] = useState({ opening_time: '11:00', closing_time: '22:00', active: false });
  
  // Animation state for the mobile mock
  const [simulatedTime, setSimulatedTime] = useState('08:00');
  const [bioStatus, setBioStatus] = useState('CLOSED');

  useEffect(() => {
    // Load Facebook SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        appId      : FB_APP_ID,
        cookie     : true,
        xfbml      : true,
        version    : 'v19.0'
      });
    };

    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/es_LA/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/instagram/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches || []);
        if (data.branches?.length > 0) {
            setIsLinked(data.branches.some(b => b.is_linked));
            const first = data.branches[0];
            const allSame = data.branches.every(b => b.opening_time === first.opening_time && b.closing_time === first.closing_time && b.autopilot_active === first.autopilot_active);
            setSyncAll(allSame);
            if (allSame) {
                setGlobalHours({ opening_time: first.opening_time, closing_time: first.closing_time, active: first.autopilot_active });
            }
        }
      }
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    if (isLinked) {
      const interval = setInterval(() => {
        setSimulatedTime(prev => {
           if(prev === '08:00') { setBioStatus('OPEN'); return '11:00'; }
           if(prev === '11:00') { setBioStatus('CLOSED'); return '22:00'; }
           if(prev === '22:00') { setBioStatus('CLOSED'); return '08:00'; }
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isLinked]);

  const handleFBLogin = () => {
    if (!window.FB) return alert("Cargando SDK de Facebook...");
    window.FB.login((response) => {
      if (response.authResponse) {
        saveConnection(response.authResponse.accessToken);
      } else {
        console.log('User cancelled login.');
      }
    }, { scope: 'instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement' });
  };

  const saveConnection = async (token) => {
    setLoading(true);
    try {
      const hubToken = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/instagram/setup-autopilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hubToken}` },
        body: JSON.stringify({ shortToken: token, branch_id: branches[0]?.id || 1 }) // Defaults to first branch for linking
      });
      if (!res.ok) throw new Error("Fallo la sincronización automática");
      await fetchStatus();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateBranchToggle = async (branchId, active, opening, closing) => {
    try {
      const hubToken = localStorage.getItem('hub_token');
      await fetch(`${API_URL}/api/admin/instagram/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hubToken}` },
        body: JSON.stringify({
          branch_id: branchId,
          active: active,
          opening_time: opening,
          closing_time: closing
        })
      });
    } catch (e) { console.warn(e); }
  };

  const handleGlobalSave = async () => {
      setLoading(true);
      for (const b of branches) {
          await updateBranchToggle(b.id, globalHours.active, globalHours.opening_time, globalHours.closing_time);
      }
      await fetchStatus();
      setLoading(false);
  };

  const handleIndividualSave = async (branchId, active, opening, closing) => {
      setLoading(true);
      await updateBranchToggle(branchId, active, opening, closing);
      await fetchStatus();
      setLoading(false);
  };

  const mainProfile = branches.find(b => b.is_linked) || branches[0] || {};

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <header className="mb-8 border-b border-white/10 pb-6">
        <h2 className="text-3xl font-light text-white mb-2 tracking-tight">
          Piloto Automático <span className="text-pink-500 font-serif italic">Meta</span>
        </h2>
        <p className="text-[10px] uppercase tracking-widest text-white/40">Sincroniza tus horarios de atención con tu biografía de Instagram</p>
      </header>

      {!isLinked ? (
        <div className="bg-white/[0.03] p-8 rounded-[2.5rem] border border-white/5 space-y-8 flex flex-col items-center max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(236,72,153,0.3)]">
               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </div>
            <div>
               <h3 className="text-2xl font-black text-white mb-4">Vende mientras duermes.</h3>
               <p className="text-sm text-white/50 leading-relaxed mb-8">Conecta tu cuenta de Instagram con un solo clic. HUB cambiará automáticamente tu bio a 'Abierto' o 'Cerrado' según tus horarios.</p>
            </div>
            <button onClick={handleFBLogin} disabled={loading} className="w-full py-5 text-[12px] uppercase tracking-[0.2em] font-black text-white rounded-[2rem] hover:scale-[1.02] transition-all shadow-[0_10px_30px_rgba(236,72,153,0.3)] bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center gap-3">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
               {loading ? 'Sincronizando...' : ' Vincular Instagram de Negocios'}
            </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto pt-8">
            
            <div className="space-y-8">
                {/* Linked Profile Card */}
                <div className="bg-white/[0.03] p-6 rounded-[2.5rem] border border-white/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <img src={mainProfile.ig_profile_picture || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-full border-2 border-pink-500 p-0.5" alt="IG Profile" />
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40">Conectado a</p>
                            <h3 className="text-xl font-bold text-white">@{mainProfile.ig_username || tenantSlug}</h3>
                        </div>
                    </div>
                    <button onClick={() => setIsLinked(false)} className="text-[9px] uppercase tracking-widest text-red-500/50 hover:text-red-500 border border-red-500/20 px-4 py-2 rounded-full">Desvincular</button>
                </div>

                {/* Configuration Area */}
                <div className="bg-white/[0.03] p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                    <div className="flex flex-col gap-4 pb-6 border-b border-white/5">
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest">Configuración de Horarios</h4>
                        
                        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors">
                            <input type="checkbox" className="w-4 h-4 rounded border-white/20 text-pink-500 focus:ring-pink-500 bg-transparent" checked={syncAll} onChange={(e) => setSyncAll(e.target.checked)} />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white">Mismo horario para todas las sedes</span>
                                <span className="text-[9px] text-white/40">Simplifica la gestión aplicando una sola regla global.</span>
                            </div>
                        </label>
                    </div>

                    {syncAll ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] text-white/40 uppercase tracking-widest">Horario Global</p>
                                <button onClick={() => { setGlobalHours({...globalHours, active: !globalHours.active}); }} className={`w-12 h-6 rounded-full relative transition-colors ${globalHours.active ? 'bg-emerald-500' : 'bg-white/10'}`}>
                                    <motion.div animate={{ x: globalHours.active ? 24 : 4 }} className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-md" />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] uppercase tracking-widest text-white/50">Apertura</label>
                                    <input type="time" value={globalHours.opening_time} onChange={(e) => setGlobalHours({...globalHours, opening_time: e.target.value})} className="bg-black border border-white/10 rounded-2xl py-3 px-4 text-xs focus:border-pink-500 outline-none text-white" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] uppercase tracking-widest text-white/50">Cierre</label>
                                    <input type="time" value={globalHours.closing_time} onChange={(e) => setGlobalHours({...globalHours, closing_time: e.target.value})} className="bg-black border border-white/10 rounded-2xl py-3 px-4 text-xs focus:border-pink-500 outline-none text-white" />
                                </div>
                            </div>
                            <button onClick={handleGlobalSave} disabled={loading} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
                                {loading ? 'Guardando...' : 'Aplicar a todas las sedes'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                            {branches.map(b => (
                                <div key={b.id} className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs font-bold text-white">Sede {b.name}</p>
                                        <button onClick={() => handleIndividualSave(b.id, !b.autopilot_active, b.opening_time, b.closing_time)} className={`w-10 h-5 rounded-full relative transition-colors ${b.autopilot_active ? 'bg-emerald-500' : 'bg-white/10'}`}>
                                            <motion.div animate={{ x: b.autopilot_active ? 20 : 2 }} className="w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-md" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="time" value={b.opening_time} onChange={(e) => {
                                            const newB = branches.map(br => br.id === b.id ? {...br, opening_time: e.target.value} : br);
                                            setBranches(newB);
                                        }} onBlur={() => handleIndividualSave(b.id, b.autopilot_active, b.opening_time, b.closing_time)} className="bg-black border border-white/10 rounded-xl py-2 px-3 text-[10px] text-white outline-none" />
                                        <input type="time" value={b.closing_time} onChange={(e) => {
                                            const newB = branches.map(br => br.id === b.id ? {...br, closing_time: e.target.value} : br);
                                            setBranches(newB);
                                        }} onBlur={() => handleIndividualSave(b.id, b.autopilot_active, b.opening_time, b.closing_time)} className="bg-black border border-white/10 rounded-xl py-2 px-3 text-[10px] text-white outline-none" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Timeline Visual */}
                <div className="space-y-6 opacity-60 scale-95 origin-top">
                    <div className="relative flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-[8px]">08 AM</div>
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex-1 text-[10px]">Actualizando Bio a: <span className="italic text-white/50">Cerrado...</span></div>
                    </div>
                    <div className="relative flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full border border-pink-500/50 flex items-center justify-center text-[8px] text-pink-500 font-bold">11 AM</div>
                        <div className="p-3 bg-white/5 border border-pink-500/20 rounded-xl flex-1 text-[10px]">Actualizando Bio a: <span className="italic text-emerald-500">¡Abiertos! ✅</span></div>
                    </div>
                </div>
            </div>

            {/* Mobile Mockup */}
            <div className="flex justify-center relative">
                <div className="w-[280px] h-[580px] bg-black border-[6px] border-zinc-800 rounded-[3rem] overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 inset-x-0 h-6 bg-zinc-800 rounded-b-3xl w-1/2 mx-auto z-20"></div>
                    
                    <div className="pt-12 px-4 pb-4 h-full bg-[#0a0a0a] flex flex-col">
                       <div className="flex justify-between items-center mb-6">
                          <span className="text-white font-bold tracking-tight">@{mainProfile.ig_username || tenantSlug}</span>
                          <span className="text-white text-xs">{simulatedTime} AM</span>
                       </div>
                       
                       <div className="flex items-center gap-4 mb-6">
                          <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-pink-500 p-0.5">
                             <img src={mainProfile.ig_profile_picture || 'https://via.placeholder.com/150'} className="w-full h-full rounded-full object-cover" alt="Profile" />
                          </div>
                          <div className="flex gap-4">
                             <div className="text-center"><div className="text-white font-bold">12</div><div className="text-white/50 text-[10px]">Posts</div></div>
                             <div className="text-center"><div className="text-white font-bold">1.2k</div><div className="text-white/50 text-[10px]">Followers</div></div>
                             <div className="text-center"><div className="text-white font-bold">84</div><div className="text-white/50 text-[10px]">Following</div></div>
                          </div>
                       </div>
                       
                       <div className="mb-4 text-sm relative h-[100px]">
                          <AnimatePresence mode="wait">
                            {bioStatus === 'OPEN' ? (
                                <motion.div key="open" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-white">
                                    <p>✅ ¡Abiertos en {tenantSlug}!</p>
                                    <p>🍔 Sabor artesanal auténtico.</p>
                                    <p className="mt-2">🚀 Pide sin filas aquí 👇</p>
                                    <p className="text-blue-400">hub.com/{tenantSlug}</p>
                                </motion.div>
                            ) : (
                                <motion.div key="closed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-white/70">
                                    <p>💤 Cerrados por ahora.</p>
                                    <p>🍔 Sabor artesanal auténtico.</p>
                                    <p className="mt-2">📅 Mira el menú y programa:</p>
                                    <p className="text-blue-400">hub.com/{tenantSlug}</p>
                                </motion.div>
                            )}
                          </AnimatePresence>
                       </div>
                       
                       <div className="flex gap-2 mb-6">
                           <div className="flex-1 py-1.5 bg-white/10 rounded-lg text-center text-white text-[10px] font-bold">Follow</div>
                           <div className="flex-1 py-1.5 bg-white/10 rounded-lg text-center text-white text-[10px] font-bold">Message</div>
                       </div>

                       <div className="grid grid-cols-3 gap-1 flex-1 content-start">
                           {[1,2,3,4,5,6].map(i => (
                               <div key={i} className="aspect-square bg-zinc-900 rounded-sm"></div>
                           ))}
                       </div>
                    </div>
                </div>
                
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1 }} className="absolute -right-12 top-1/2 bg-amber-500 text-black text-[10px] font-black uppercase px-3 py-2 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.5)] transform -rotate-6">
                    Live Simulator
                </motion.div>
            </div>
        </div>
      )}
    </motion.div>
  );
};
