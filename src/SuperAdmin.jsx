import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const SuperAdmin = () => {
  const [showAIModal, setShowAIModal] = useState(false);
  const [tenants, setTenants] = useState([]);
  const navigate = useNavigate();

  const loadTenants = () => {
    fetch(`${API_URL}/api/admin/tenants`)
      .then(res => res.json())
      .then(data => setTenants(data))
      .catch(err => console.error("Error loading tenants:", err));
  };

  useEffect(() => {
    loadTenants();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-10 font-sans relative overflow-x-hidden">
      <div className="mb-12 flex items-center justify-start">
        <img src="/logo.png" alt="HUB" className="h-[4.5rem] object-contain invert mix-blend-screen opacity-90" />
        <span className="text-amber-500/50 italic text-2xl ml-4 font-serif self-end pb-2">Network</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Generar Tarjetas por cada Tenant Dinamico */}
        {tenants.map(t => {
           // Simulación de Facturación en base a la cantidad de Items para la demo
           const cost = Math.max(15, t.total_products * 8); 
           
           return (
            <div key={t.id} className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 flex flex-col justify-between hover:bg-white/[0.04] transition-all">
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
          className="border border-dashed border-white/10 rounded-[2rem] p-8 flex flex-col items-center justify-center text-white/30 hover:text-amber-500 hover:border-amber-500/50 cursor-pointer transition-colors min-h-[300px]">
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
  const [step, setStep] = useState(1); // 1: Form, 2: Loading, 3: Success
  const [formData, setFormData] = useState({ name: '', slug: '', brand_color: '#f59e0b' });
  const [file, setFile] = useState(null);

  const handleProcess = async () => {
    if (!formData.name || !formData.slug || !file) {
      alert("Por favor completa nombre, slug y sube la foto del menú.");
      return;
    }
    setStep(2);
    
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('slug', formData.slug);
      data.append('brand_color', formData.brand_color);
      data.append('file', file);

      const res = await fetch(`${API_URL}/api/admin/onboard`, {
        method: 'POST',
        body: data
      });

      if (!res.ok) throw new Error("Error procesando imagen AI");
      
      const result = await res.json();
      console.log("Resultado Inserción AI:", result);
      if (onSuccess) onSuccess(); // Recargar el listado
      setStep(3);
    } catch (err) {
      alert("Error en el motor AI: " + err.message);
      setStep(1);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-[#050505] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-lg relative overflow-hidden shadow-2xl">
        
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
              <input type="text" placeholder="Nombre Comercial" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-amber-500 transition-colors placeholder-white/30" />
              <div className="flex gap-4">
                <input type="text" placeholder="URL Slug (ej: sushi-bar)" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-amber-500 transition-colors placeholder-white/30" />
                <input type="color" value={formData.brand_color} onChange={e => setFormData({...formData, brand_color: e.target.value})} className="h-[52px] w-[60px] rounded-2xl border-none cursor-pointer bg-white/5 p-1" />
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
            <button 
                onClick={onClose}
                className="px-8 py-3 bg-white/10 text-white font-bold uppercase tracking-widest text-[9px] rounded-full hover:bg-white/20 transition-colors"
                >
                Volver al Panel
            </button>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
};
