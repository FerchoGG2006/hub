import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { Card, Heading, Badge, Button } from '../../../shared/ui';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const FB_APP_ID = import.meta.env.VITE_FB_APP_ID || '1064126132049987';

export const InstagramAutopilot = () => {
  const { tenantSlug } = useParams();
  const [isLinked, setIsLinked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [globalHours, setGlobalHours] = useState({ opening_time: '11:00', closing_time: '22:00', active: false });
  
  const [simulatedTime, setSimulatedTime] = useState('08:00');
  const [bioStatus, setBioStatus] = useState('CLOSED');

  useEffect(() => {
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
        const branchList = data.branches || [];
        setBranches(branchList);
        if (branchList.length > 0) {
            setIsLinked(branchList.some(b => b.is_linked));
            const first = branchList[0];
            const allSame = branchList.every(b => b.opening_time === first.opening_time && b.closing_time === first.closing_time && b.autopilot_active === first.autopilot_active);

            if (allSame) {
                setGlobalHours({ opening_time: first.opening_time, closing_time: first.closing_time, active: first.autopilot_active });
            }

            // Inicializar el simulador con el estado real del backend
            setBioStatus(first.is_open ? 'OPEN' : 'CLOSED');
            setSimulatedTime(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }));
        }
      }
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    if (isLinked && branches.length > 0) {
      const first = branches[0];
      const interval = setInterval(() => {
        setSimulatedTime(prev => {
           // Ciclamos para demostrar cómo cambia de forma dinámica
           if (bioStatus === 'CLOSED') {
               setBioStatus('OPEN');
               return first.opening_time || '11:00';
           } else {
               setBioStatus('CLOSED');
               return first.closing_time || '22:00';
           }
        });
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isLinked, branches, bioStatus]);


  const handleFBLogin = () => {
    if (!window.FB) return alert("Cargando SDK de Facebook...");
    window.FB.login((response) => {
      if (response.authResponse) {
        saveConnection(response.authResponse.accessToken);
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
        body: JSON.stringify({ shortToken: token, branch_id: branches[0]?.id || 1 })
      });
      if (!res.ok) throw new Error("Fallo la sincronización automática");
      await fetchStatus();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalSave = async () => {
      setLoading(true);
      for (const b of branches) {
        try {
          const hubToken = localStorage.getItem('hub_token');
          await fetch(`${API_URL}/api/admin/instagram/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hubToken}` },
            body: JSON.stringify({
              branch_id: b.id,
              active: globalHours.active,
              opening_time: globalHours.opening_time,
              closing_time: globalHours.closing_time
            })
          });
        } catch (e) { console.warn(e); }
      }
      await fetchStatus();
      setLoading(false);
  };

  const mainProfile = branches.find(b => b.is_linked) || branches[0] || {};

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
      <header className="border-b border-[var(--border-soft)] pb-10">
        <Badge variant="brand" className="mb-2">Autopiloto Social</Badge>
        <Heading level={2}>Asistente de <span className="font-[var(--font-serif)] italic text-pink-600">Instagram</span></Heading>
        <p className="text-[var(--text-muted)] text-sm mt-1">Sincroniza el horario de tu restaurante con tu biografía automáticamente.</p>
      </header>

      {!isLinked ? (
        <Card className="!p-16 flex flex-col items-center max-w-2xl mx-auto text-center !rounded-[3.5rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 blur-[60px] pointer-events-none" />
            
            <div className="w-24 h-24 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-10 transform rotate-6">
               <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </div>
            
            <Heading level={3} className="!text-3xl uppercase italic tracking-tighter mb-4">Presencia 24/7</Heading>
            <p className="text-[var(--text-muted)] leading-relaxed mb-10 text-sm max-w-sm">
                Conecta tu cuenta para que el asistente cambie tu estado a <span className="text-emerald-600 font-bold">'Abierto'</span> o <span className="text-red-600 font-bold">'Cerrado'</span> en tiempo real.
            </p>
            
            <Button onClick={handleFBLogin} isLoading={loading} className="w-full py-5 !bg-[#1A1208] text-white !rounded-2xl uppercase tracking-[0.3em] flex items-center justify-center gap-3">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
               {loading ? 'Sincronizando...' : 'Vincular Instagram'}
            </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            
            <div className="space-y-10">
                <Card className="!p-6 !rounded-[2.5rem] flex items-center justify-between border-[var(--border-soft)] relative">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <img src={mainProfile.ig_profile_picture || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-full border-2 border-pink-500 p-0.5" alt="IG" />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-[10px]">✨</div>
                        </div>
                        <div>
                            <p className="text-[9px] uppercase tracking-widest text-[var(--text-disabled)] font-black">Cuenta Activa</p>
                            <Heading level={4} className="!text-lg">@{mainProfile.ig_username || tenantSlug}</Heading>
                        </div>
                    </div>
                    <Button variant="secondary" onClick={() => setIsLinked(false)} className="!py-2 !px-4 !text-[9px] uppercase !rounded-full">Desvincular</Button>
                </Card>

                <Card className="!p-10 !rounded-[3rem] space-y-8">
                    <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-8">
                        <div>
                            <Heading level={4} className="!text-xs uppercase tracking-[0.3em]">REGLAS DE HORARIO</Heading>
                            <p className="text-[9px] text-[var(--text-disabled)] uppercase font-bold mt-1">Sincronización automática de Bio</p>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className={`text-[10px] font-black uppercase tracking-widest ${globalHours.active ? 'text-emerald-600' : 'text-[var(--text-disabled)]'}`}>
                             {globalHours.active ? 'ON' : 'OFF'}
                           </span>
                           <button onClick={() => setGlobalHours({...globalHours, active: !globalHours.active})} className={`w-12 h-6 rounded-full relative transition-colors ${globalHours.active ? 'bg-emerald-500' : 'bg-[var(--bg-tertiary)]'}`}>
                                <motion.div animate={{ x: globalHours.active ? 24 : 4 }} className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm" />
                           </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-widest text-[var(--text-disabled)] font-black">Apertura</label>
                            <input type="time" value={globalHours.opening_time} onChange={(e) => setGlobalHours({...globalHours, opening_time: e.target.value})} className="w-full bg-[var(--bg-secondary)] border border-[var(--border-soft)] rounded-2xl py-4 px-5 text-sm focus:border-pink-500 outline-none text-[var(--text-primary)] font-mono font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-widest text-[var(--text-disabled)] font-black">Cierre</label>
                            <input type="time" value={globalHours.closing_time} onChange={(e) => setGlobalHours({...globalHours, closing_time: e.target.value})} className="w-full bg-[var(--bg-secondary)] border border-[var(--border-soft)] rounded-2xl py-4 px-5 text-sm focus:border-pink-500 outline-none text-[var(--text-primary)] font-mono font-bold" />
                        </div>
                    </div>

                    <Button onClick={handleGlobalSave} isLoading={loading} className="w-full py-5 !rounded-2xl uppercase tracking-[0.3em] !text-[10px]">
                        {loading ? 'Sincronizando...' : 'Desplegar en Red Global'}
                    </Button>
                </Card>
            </div>

            <div className="flex justify-center relative">
                <div className="w-[300px] h-[600px] bg-white border-[12px] border-[var(--bg-tertiary)] rounded-[4rem] overflow-hidden relative shadow-2xl">
                    <div className="absolute top-0 inset-x-0 h-6 bg-[var(--bg-tertiary)] rounded-b-3xl w-1/3 mx-auto z-20"></div>
                    
                    <div className="pt-14 px-6 h-full flex flex-col">
                       <div className="flex justify-between items-center mb-8">
                          <span className="text-black font-black tracking-tighter text-[10px] uppercase italic">@{mainProfile.ig_username || tenantSlug}</span>
                          <Badge variant="brand" className="!py-1 !px-2 !text-[8px] font-mono">{simulatedTime} AM</Badge>
                       </div>
                       
                       <div className="flex items-center gap-6 mb-8">
                          <div className="w-20 h-20 rounded-full border-2 border-pink-500 p-0.5 shadow-lg">
                             <img src={mainProfile.ig_profile_picture || 'https://via.placeholder.com/150'} className="w-full h-full rounded-full object-cover" alt="Avatar" />
                          </div>
                          <div className="flex-1 flex justify-around">
                             <div className="text-center"><div className="text-black font-black text-xs">12</div><div className="text-gray-400 text-[8px] font-bold uppercase">Posts</div></div>
                             <div className="text-center"><div className="text-black font-black text-xs">1.2k</div><div className="text-gray-400 text-[8px] font-bold uppercase">Follow</div></div>
                             <div className="text-center"><div className="text-black font-black text-xs">84</div><div className="text-gray-400 text-[8px] font-bold uppercase">Ing</div></div>
                          </div>
                       </div>
                       
                       <div className="mb-8 min-h-[120px]">
                          <AnimatePresence mode="wait">
                            {bioStatus === 'OPEN' ? (
                                <motion.div key="open" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-1">
                                    <p className="font-bold text-xs text-emerald-600">✅ ¡ABIERTO AHORA!</p>
                                    <p className="text-[11px] text-gray-600 leading-tight">Hamburguesas de autor y sabor local. 🍔✨</p>
                                    <p className="text-[10px] font-bold text-gray-400 pt-3 uppercase tracking-widest">Pide aquí 👇</p>
                                    <p className="text-blue-600 font-bold text-[11px]">platorin.com/{tenantSlug}</p>
                                </motion.div>
                            ) : (
                                <motion.div key="closed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-1 opacity-50">
                                    <p className="font-bold text-xs">💤 CERRADO POR AHORA</p>
                                    <p className="text-[11px] text-gray-600 leading-tight">Hamburguesas de autor y sabor local. 🍔✨</p>
                                    <p className="text-[10px] font-bold text-gray-400 pt-3 uppercase tracking-widest">Mira el menú 👇</p>
                                    <p className="text-blue-600 font-bold text-[11px]">platorin.com/{tenantSlug}</p>
                                </motion.div>
                            )}
                          </AnimatePresence>
                       </div>
                       
                       <div className="flex gap-2 mb-10">
                           <div className="flex-1 py-2.5 bg-black text-white rounded-lg text-center text-[9px] font-black uppercase tracking-widest">Follow</div>
                           <div className="flex-1 py-2.5 bg-gray-100 rounded-lg text-center text-black text-[9px] font-black uppercase tracking-widest">Message</div>
                       </div>

                       <div className="grid grid-cols-3 gap-1 flex-1 content-start opacity-10">
                           {[1,2,3,4,5,6].map(i => (
                               <div key={i} className="aspect-square bg-black rounded-sm"></div>
                           ))}
                       </div>
                    </div>
                </div>
                
                <Badge variant="brand" className="absolute -right-8 top-1/2 transform -rotate-6 !bg-[var(--brand-accent)] !text-white !p-3 shadow-xl">
                   LIVE SIMULATOR
                </Badge>
            </div>
        </div>
      )}
    </motion.div>
  );
};
