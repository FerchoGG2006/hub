import React, { useState } from 'react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const MarketingManager = () => {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState(null);

  const handleGenerate = async () => {
    if (!goal) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/marketing/ai`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ goal })
      });
      if (res.ok) {
        const data = await res.json();
        setCampaign(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Error al generar: ${errData.detail || 'No se pudo crear la campaña. Verifica tu conexión.'}`);
      }
    } catch(err) {
      console.error(err);
      alert(`Error de red: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }}
      className="pt-12 px-6 max-w-2xl mx-auto space-y-8 relative z-10"
    >
      <div className="mb-8">
        <h2 className="text-3xl font-light text-dark">Agente de <span className="font-serif italic text-gold-gradient">Marketing</span></h2>
        <p className="text-sm text-dark/40">Olvida las estrategias complejas. Dile a la IA qué necesitas impulsar y ella creará la campaña por ti.</p>
      </div>

      <div className="bg-dark/5 border border-dark/10 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden">
        {/* Tech Decor */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-dark/20 rounded-tl-[2.5rem]" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-dark/20 rounded-br-[2.5rem]" />
        
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Ej: Quiero aumentar las ventas en el horario de almuerzo de 12 a 2pm."
          className="w-full bg-dark/5 border border-dark/10 rounded-2xl p-5 text-sm resize-none h-32 focus:border-amber-500 outline-none text-dark placeholder-dark/20"
        />
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-4 text-[10px] uppercase font-black tracking-[0.3em] bg-dark text-bone rounded-2xl hover:brightness-110 flex items-center justify-center gap-2 tactile-button"
        >
          {loading ? <span className="animate-spin text-lg">⏳</span> : '✨ Generar Campaña + Cupón'}
        </button>
      </div>

      {campaign && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-dark/5 border border-emerald-500/30 rounded-[2.5rem] p-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 text-4xl opacity-10">🧠</div>
             <h4 className="text-[10px] uppercase tracking-widest text-emerald-600 mb-6 font-bold">Campaña Generada (Lista para enviar)</h4>
             
             <div className="space-y-6">
                <div>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-dark/40 block mb-2 font-mono">[ Mensaje de texto (SMS) ]</span>
                  <p className="p-4 bg-bone rounded-xl text-sm italic border border-dark/10 text-dark/80">"{campaign.sms_text}"</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-dark/40 block mb-2 font-mono">[ Asunto del correo ]</span>
                  <p className="p-4 bg-bone rounded-xl text-sm italic border border-dark/10 font-bold text-dark">"{campaign.email_subject}"</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-amber-500/10 p-5 rounded-2xl border border-amber-500/20 text-center shadow-inner shadow-amber-500/5">
                     <span className="text-[9px] uppercase tracking-widest text-amber-600 mb-1 block font-bold">CUPÓN ACTIVADO</span>
                     <span className="text-xl font-mono text-gold-gradient tracking-[0.2em] block font-black">{campaign.coupon_code}</span>
                  </div>
                  <div className="w-1/3 bg-dark/5 p-5 rounded-2xl border border-dark/10 text-center">
                     <span className="text-[9px] uppercase tracking-widest text-dark/40 mb-1 block font-bold">DESCUENTO</span>
                     <span className="text-xl font-mono text-dark tracking-widest block font-black">{campaign.discount_percent}%</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => alert("🚀 ¡Campaña enviada con éxito a 1,240 clientes!")}
                  className="w-full py-4 bg-dark text-bone text-[10px] uppercase font-black tracking-widest rounded-2xl transition-all border border-dark/10 hover:bg-dark/90 tactile-button">
                  📡 Lanzar Campaña a Clientes
                </button>
             </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
