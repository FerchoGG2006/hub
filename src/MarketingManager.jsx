import React, { useState } from 'react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const MarketingManager = ({ tenantSlug }) => {
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
      }
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="pt-12 px-6 max-w-2xl mx-auto space-y-8 relative z-10">
      <div className="mb-8">
        <h2 className="text-3xl font-light">Agente de <span className="font-serif italic text-amber-500">Marketing</span></h2>
        <p className="text-sm text-white/40">Olvida las estrategias complejas. Dile a la IA qué necesitas impulsar y ella creará la campaña por ti.</p>
      </div>

      <div className="bg-black/40 border border-white/5 rounded-[2rem] p-8 space-y-6">
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Ej: Quiero aumentar las ventas en el horario de almuerzo de 12 a 2pm."
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm resize-none h-32 focus:border-amber-500 outline-none text-white"
        />
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-4 text-[10px] uppercase font-black tracking-widest bg-amber-500 text-black rounded-xl hover:brightness-110 flex items-center justify-center gap-2"
        >
          {loading ? <span className="animate-spin text-lg">⏳</span> : '✨ Generar Campaña + Cupón'}
        </button>
      </div>

      {campaign && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white/[0.02] border border-green-500/30 rounded-[2rem] p-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 text-4xl opacity-10">🧠</div>
             <h4 className="text-[10px] uppercase tracking-widest text-green-400 mb-6">Campaña Generada</h4>
             
             <div className="space-y-6">
                <div>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/30 block mb-2">Mensaje SMS (Para clientes)</span>
                  <p className="p-4 bg-black/40 rounded-xl text-sm italic border border-white/5">"{campaign.sms_text}"</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/30 block mb-2">Asunto Boletín / Email</span>
                  <p className="p-4 bg-black/40 rounded-xl text-sm italic border border-white/5 font-bold">"{campaign.email_subject}"</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-amber-500/10 p-5 rounded-2xl border border-amber-500/20 text-center">
                     <span className="text-[9px] uppercase tracking-widest text-amber-500 mb-1 block">Cupón Activado</span>
                     <span className="text-xl font-mono text-white tracking-widest block font-bold">{campaign.coupon_code}</span>
                  </div>
                  <div className="w-1/3 bg-white/5 p-5 rounded-2xl border border-white/10 text-center">
                     <span className="text-[9px] uppercase tracking-widest text-white/40 mb-1 block">Descuento</span>
                     <span className="text-xl font-mono text-white tracking-widest block font-bold">{campaign.discount_percent}%</span>
                  </div>
                </div>
             </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
