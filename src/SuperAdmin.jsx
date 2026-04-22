import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { LoginTerminal } from './AdminDashboard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const SuperAdmin = () => {
  const [showAIModal, setShowAIModal] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const loadTenants = () => {
    const token = localStorage.getItem('hub_token');
    fetch(`${API_URL}/api/admin/tenants`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setTenants(data))
      .catch(err => console.error("Error loading tenants:", err));
  };

  useEffect(() => {
    if (isAuthenticated) loadTenants();
  }, [isAuthenticated]);

  if (!isAuthenticated) return <AnimatePresence mode="wait"><LoginTerminal onAuth={() => setIsAuthenticated(true)} /></AnimatePresence>;

  return (
    <div className="min-h-screen bg-[#020202] text-white p-10 font-sans relative overflow-x-hidden">
      
      {/* ─── AMBIENT BACKGROUND GLOWS ─── */}
      <div className="absolute top-0 inset-x-0 h-[800px] pointer-events-none opacity-30 z-0">
         <div className="absolute top-[-20%] left-[20%] w-[50vw] h-[50vw] rounded-full blur-[120px] mix-blend-screen bg-gradient-to-r from-amber-500/20 to-orange-600/10"></div>
         <div className="absolute top-[10%] right-[10%] w-[30vw] h-[30vw] rounded-full blur-[100px] mix-blend-screen bg-gradient-to-l from-amber-300/10 to-transparent"></div>
      </div>
      
      {/* ─── DOT MATRIX PATTERN ─── */}
      <div 
         className="absolute inset-0 pointer-events-none z-0" 
         style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      ></div>

      <div className="mb-12 flex items-center justify-start relative z-10">
        <img src="/logo.png" alt="HUB" className="h-[4.5rem] object-contain drop-shadow-xl" />
        <span className="text-amber-500/50 italic text-2xl ml-4 font-serif self-end pb-2">Network</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {/* Generar Tarjetas por cada Tenant Dinamico */}
        {tenants.map(t => {
           // Simulación de Facturación en base a la cantidad de Items para la demo
           const cost = Math.max(15, t.total_products * 8); 
           
           return (
            <div key={t.id} className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.05] rounded-[2rem] p-8 flex flex-col justify-between hover:border-amber-500/20 transition-all group backdrop-blur-md">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">{t.name}</h3>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 mt-1">/{t.slug}</p>
                </div>
                <div className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[8px] uppercase tracking-widest rounded-full font-bold">
                  Activo
                </div>
              </div>
              
              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Plan</span>
                  <span className="font-medium">Premium</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Colecciones</span>
                  <span className="font-medium">{t.total_products} Ítems</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Facturación (Proyectada)</span>
                  <span className="font-medium">${cost} USD/mo</span>
                </div>
              </div>
              
              <button 
                onClick={() => navigate(`/admin/${t.slug}`)}
                className="w-full py-3 rounded-xl bg-white/5 text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-colors font-bold">
                Entrar como Admin
              </button>
            </div>
           );
        })}
        
        {/* Placeholder Agregar Nuevo */}
        <div 
          onClick={() => setShowAIModal(true)}
          className="bg-transparent border border-dashed border-white/10 rounded-[2rem] p-8 flex flex-col items-center justify-center text-white/30 hover:text-amber-500 hover:border-amber-500/30 hover:bg-amber-500/5 cursor-pointer transition-all min-h-[300px] backdrop-blur-sm">
          <span className="text-4xl mb-4 font-light">+</span>
          <span className="text-[10px] uppercase tracking-[0.2em]">Desplegar Nuevo HUB</span>
        </div>
      </div>

      <AnimatePresence>
        {showAIModal && <AIOnboardingModal onClose={() => setShowAIModal(false)} onSuccess={loadTenants} />}
      </AnimatePresence>
    </div>
  );
};

/* ── COMPONENTE: AGENTE DE INSERCIÓN AI ── */
const AIOnboardingModal = ({ onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Form, 2: Loading, 3: Success
  const [formData, setFormData] = useState({ name: '', slug: '', brand_color: '#f59e0b', whatsapp_number: '', country_code: '+57' });
  const [file, setFile] = useState(null);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  // Detección automática de país
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz.includes('Mexico')) setFormData(f => ({ ...f, country_code: '+52' }));
      else if (tz.includes('Madrid')) setFormData(f => ({ ...f, country_code: '+34' }));
      else if (tz.includes('Argentina')) setFormData(f => ({ ...f, country_code: '+54' }));
      else if (tz.includes('Chicago') || tz.includes('New_York')) setFormData(f => ({ ...f, country_code: '+1' }));
      // Default es +57 (Colombia) ya que es el mercado principal
    } catch {
       // Silenciosamente ignorar si falla la resolución de zona horaria
    }
  }, []);

  const handleNameChange = (val) => {
    const slug = val.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setFormData({ ...formData, name: val, slug });
  };

  const handleProcess = async () => {
    if (!formData.name || !formData.slug || !file) {
      alert("Por favor completa nombre, slug y sube la foto del menú.");
      return;
    }
    setStep(2);
    
    try {
      const fullPhone = formData.whatsapp_number ? formData.country_code.replace('+', '') + formData.whatsapp_number.replace(/\D/g, '') : '';
      const data = new FormData();
      data.append('name', formData.name);
      data.append('slug', formData.slug);
      data.append('brand_color', formData.brand_color);
      if (fullPhone) data.append('whatsapp_number', fullPhone);
      data.append('file', file);

      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/onboard`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });

      if (!res.ok) throw new Error("Error procesando imagen AI");
      
      const result = await res.json();
      console.log("Resultado Inserción AI:", result);
      if (result.credentials) {
        setCreatedCredentials(result.credentials);
      }
      if (onSuccess) onSuccess(); // Recargar el listado
      setStep(3);
    } catch (err) {
      alert("Error en el motor AI: " + err.message);
      setStep(1);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-lg relative overflow-y-auto max-h-[90vh] shadow-[0_30px_100px_rgba(245,158,11,0.07)]">
        
        {/* Glow AI */}
        {step === 2 && (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} className="absolute -inset-10 bg-amber-500/20 opacity-50 blur-[100px] pointer-events-none" />
        )}

        <div className="flex justify-between items-center mb-10 relative z-10">
          <h2 className="text-xl font-normal text-white flex items-center gap-3">
            <span className="text-amber-500 text-2xl">✦</span> Agente de Inserción AI
          </h2>
          <button onClick={onClose} className="text-[9px] uppercase tracking-widest text-white/40 hover:text-white transition-colors">Cerrar</button>
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 relative z-10">
            <div className="space-y-4">
              <div className="group">
                <label className="text-[9px] uppercase tracking-[0.2em] text-white/30 ml-2 mb-1 block font-bold">Identidad del HUB</label>
                <input 
                  type="text" 
                  placeholder="Nombre Comercial (ej: Sushi Master)" 
                  value={formData.name} 
                  onChange={e => handleNameChange(e.target.value)} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-amber-500 transition-colors placeholder-white/20" 
                />
              </div>

              <div className="flex gap-3">
                <div className="w-1/3">
                  <label className="text-[9px] uppercase tracking-[0.2em] text-white/30 ml-2 mb-1 block font-bold">URL / Slug</label>
                  <input 
                    type="text" 
                    placeholder="URL Slug" 
                    value={formData.slug} 
                    onChange={e => setFormData({...formData, slug: e.target.value})} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-mono outline-none focus:border-amber-500 transition-colors placeholder-white/20" 
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] uppercase tracking-[0.2em] text-white/30 ml-2 mb-1 block font-bold">Línea de Órdenes</label>
                  <div className="flex gap-2">
                    <select 
                      value={formData.country_code} 
                      onChange={e => setFormData({...formData, country_code: e.target.value})}
                      className="bg-white/5 border border-white/10 rounded-2xl px-3 py-4 text-xs text-white outline-none focus:border-amber-500 transition-colors appearance-none"
                    >
                      <option value="+57">🇨🇴 +57</option>
                      <option value="+52">🇲🇽 +52</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+54">🇦🇷 +54</option>
                      <option value="+56">🇨🇱 +56</option>
                      <option value="+51">🇵🇪 +51</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder="WhatsApp" 
                      value={formData.whatsapp_number} 
                      onChange={e => setFormData({...formData, whatsapp_number: e.target.value})} 
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-amber-500 transition-colors placeholder-white/20" 
                    />
                  </div>
                </div>
                <div className="w-20">
                  <label className="text-[9px] uppercase tracking-[0.2em] text-white/30 ml-2 mb-1 block font-bold text-center">Marca</label>
                  <div className="relative w-full h-[54px] rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden hover:border-amber-500/50 transition-colors">
                    <input 
                      type="color" 
                      value={formData.brand_color} 
                      onChange={e => setFormData({...formData, brand_color: e.target.value})} 
                      className="absolute inset-0 w-[200%] h-[200%] -top-[50%] -left-[50%] cursor-pointer bg-transparent border-none p-0 outline-none" 
                    />
                    <div className="pointer-events-none w-6 h-6 rounded-full shadow-2xl border border-white/20" style={{ backgroundColor: formData.brand_color }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border border-dashed border-white/20 rounded-2xl p-6 text-center hover:border-amber-500/50 transition-colors cursor-pointer relative overflow-hidden group">
              <input type="file" accept="image/*,application/pdf" onChange={e => setFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <p className="text-[10px] tracking-widest uppercase text-white/50 group-hover:text-amber-500 transition-colors">
                {file ? file.name : "Subir Foto del Menú Actual"}
              </p>
            </div>

            <button onClick={handleProcess} className="w-full py-4 rounded-2xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all">
              Ejecutar Inserción Inteligente
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 flex flex-col items-center justify-center space-y-6 relative z-10">
            <div className="w-16 h-16 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-[10px] tracking-[0.2em] uppercase text-amber-500 font-bold mb-2">Analizando Carta Visual</p>
              <p className="text-xs text-white/40 italic">El modelo LLM está extrayendo categorías, cruzando precios y asignando emojis para la estructura.</p>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 flex flex-col items-center justify-center space-y-6 relative z-10 text-center">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              ✓
            </div>
            <div>
              <p className="text-lg font-bold text-white mb-1">{formData.name} Integrado</p>
              <p className="text-[10px] tracking-widest uppercase text-white/40 mb-6">Base de Datos Generada. Tenant Listo.</p>
            </div>
            
            {createdCredentials && (
              <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-4 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full" />
                <p className="text-[9px] uppercase tracking-widest text-amber-500 mb-3 text-center font-black">Acceso Propietario Activado</p>
                <div className="flex justify-between items-center mb-2 px-2">
                  <span className="text-[10px] text-white/50 uppercase tracking-widest">USER_ID</span>
                  <span className="font-mono text-sm tracking-widest text-white">{createdCredentials.username}</span>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] text-white/50 uppercase tracking-widest">PASSCODE</span>
                  <span className="font-mono text-sm tracking-widest text-amber-500">{createdCredentials.passcode}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 w-full">
              <button 
                  onClick={() => navigate(`/admin/${formData.slug}`)}
                  className="w-full py-4 bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:scale-[1.02] transition-transform shadow-[0_10px_30px_rgba(245,158,11,0.3)]">
                  🚀 Lanzar Dashboard de {formData.name}
              </button>
              <button 
                  onClick={onClose}
                  className="w-full py-3 bg-white/5 text-white/40 font-bold uppercase tracking-widest text-[9px] rounded-2xl hover:bg-white/10 transition-colors">
                  Cerrar y Volver a la Red
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
};
