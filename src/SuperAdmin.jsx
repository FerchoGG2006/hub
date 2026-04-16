import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const SuperAdmin = () => {
  const [showAIModal, setShowAIModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-10 font-sans relative overflow-x-hidden">
      <div className="mb-12 flex items-center justify-start">
        <img src="/logo.png" alt="HUB" className="h-[4.5rem] object-contain invert mix-blend-screen opacity-90" />
        <span className="text-amber-500/50 italic text-2xl ml-4 font-serif self-end pb-2">Network</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card de Cliente */}
        <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[2.5rem]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold tracking-tight">La Rivera Tech</h3>
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 mt-1">/la-rivera</p>
            </div>
            <span className="bg-amber-500/10 text-amber-500 text-[8px] px-3 py-1.5 rounded-full uppercase tracking-widest font-bold border border-amber-500/20">Activo</span>
          </div>
          
          <div className="space-y-2 mb-8">
            <p className="text-xs text-white/40 flex justify-between">Plan <span className="text-white">Premium</span></p>
            <p className="text-xs text-white/40 flex justify-between">Colecciones <span className="text-white">18 Items</span></p>
            <p className="text-xs text-white/40 flex justify-between">Facturación <span className="text-white">$145 USD/mo</span></p>
          </div>

          <button className="w-full py-3 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl text-[10px] uppercase font-bold tracking-widest text-white/60 hover:text-white">
            Entrar como Admin
          </button>
        </div>
        
        {/* Botón para nuevo cliente */}
        <motion.button 
          onClick={() => setShowAIModal(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="border border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center p-6 hover:bg-white/5 transition-all min-h-[280px]"
        >
          <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-4 bg-white/[0.02]">
            <span className="text-2xl font-light text-amber-500">+</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/50">Desplegar Nuevo HUB</span>
        </motion.button>
      </div>

      {/* MODAL DE INSERCIÓN AI */}
      <AnimatePresence>
        {showAIModal && (
          <AIOnboardingModal onClose={() => setShowAIModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── COMPONENTE: AGENTE DE INSERCIÓN AI ── */
const AIOnboardingModal = ({ onClose }) => {
  const [step, setStep] = useState(1); // 1: Datos, 2: Procesando AI, 3: Éxito
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
      setStep(3);
    } catch (err) {
      alert("Error en el motor AI: " + err.message);
      setStep(1);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }}
        className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-light tracking-tight flex items-center gap-3">
              <span className="text-amber-500">✦</span> Agente de Inserción AI
            </h2>
            <button onClick={onClose} className="text-white/30 hover:text-white uppercase text-[8px] tracking-[0.2em]">Cerrar</button>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <input 
                  type="text" placeholder="Nombre Comercial (Ej: Pizza Colombia)" 
                  className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-amber-500 transition-colors"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
                <div className="flex gap-4">
                  <input 
                    type="text" placeholder="URL Slug (ej: pizzacol)" 
                    className="w-2/3 bg-white/[0.02] border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-amber-500 transition-colors"
                    value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})}
                  />
                  <div className="w-1/3 flex items-center bg-white/[0.02] border border-white/10 rounded-2xl px-4">
                    <input 
                      type="color" value={formData.brand_color} 
                      onChange={e => setFormData({...formData, brand_color: e.target.value})}
                      className="bg-transparent border-none w-full h-8 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="border-2 border-dashed border-white/10 rounded-[2rem] p-8 text-center hover:bg-white/[0.02] transition-colors relative cursor-pointer">
                <input 
                  type="file" accept="image/*,.pdf" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={e => setFile(e.target.files[0])}
                />
                <div className="text-4xl mb-3">{file ? '📸' : '📄'}</div>
                <p className="text-[10px] tracking-widest uppercase text-white/50">
                  {file ? file.name : "Subir PDF o Foto del Menú Antiguo"}
                </p>
              </div>

              <button 
                onClick={handleProcess}
                className="w-full py-4 mt-4 bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-amber-400 transition-colors"
              >
                Ejecutar Inserción Inteligente
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-6" />
              <p className="text-[10px] tracking-[0.3em] uppercase text-amber-500 animate-pulse font-bold">Analizando Carta Visual</p>
              <p className="text-[9px] text-white/30 mt-4 max-w-xs leading-relaxed">
                El modelo LLM está extrayendo categorías, cruzando precios y asignando emojis para la estructura {formData.slug}.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-2xl mb-6">✓</div>
              <p className="text-[14px] tracking-widest uppercase text-white font-bold mb-2">HUB Creado Exitosamente</p>
              <p className="text-[10px] text-white/40 mb-8">Base de datos poblada en 4.2 segs.</p>
              
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-white/10 text-white font-bold uppercase tracking-widest text-[9px] rounded-full hover:bg-white/20 transition-colors"
              >
                Volver al Panel
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
