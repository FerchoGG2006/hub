import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, Heading, Badge, Button } from '../../../shared/ui';

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
        alert(`Error al generar: ${errData.detail || 'No se pudo crear la campaña.'}`);
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
      className="max-w-3xl mx-auto space-y-12"
    >
      <header className="border-b border-[var(--border-soft)] pb-10">
        <Badge variant="brand" className="mb-2">Marketing con IA</Badge>
        <Heading level={2}>Agente de <span className="font-[var(--font-serif)] italic">Crecimiento</span></Heading>
        <p className="text-[var(--text-muted)] text-sm mt-1">Dile a la IA qué necesitas impulsar y ella creará la campaña por ti.</p>
      </header>

      <Card className="space-y-6 !rounded-[3rem] relative overflow-hidden">
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Ej: Quiero aumentar las ventas en el horario de almuerzo de 12 a 2pm."
          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-soft)] rounded-[2rem] p-6 text-sm resize-none h-40 focus:border-[var(--brand-accent)] outline-none text-[var(--text-primary)] placeholder-[var(--text-disabled)]"
        />
        <Button 
          onClick={handleGenerate}
          isLoading={loading}
          className="w-full py-5 text-[10px] uppercase font-black tracking-[0.3em] !rounded-2xl"
        >
          ✨ Generar Estrategia AI
        </Button>
      </Card>

      {campaign && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card className="!border-[var(--brand-accent)]/30 !rounded-[3rem] relative overflow-hidden p-10">
             <div className="absolute top-0 right-0 p-10 text-4xl opacity-10">🧠</div>
             <Badge variant="success" className="mb-8">Campaña Optimizada</Badge>
             
             <div className="space-y-8">
                <div>
                  <span className="text-[9px] uppercase tracking-[0.3em] text-[var(--text-disabled)] block mb-3 font-bold">Guion SMS / WhatsApp</span>
                  <p className="p-6 bg-[var(--bg-secondary)] rounded-2xl text-sm italic border border-[var(--border-soft)] text-[var(--text-muted)] leading-relaxed">
                    "{campaign.sms_text}"
                  </p>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-[0.3em] text-[var(--text-disabled)] block mb-3 font-bold">Asunto de Email sugerido</span>
                  <Heading level={4} className="p-6 bg-[var(--bg-secondary)] rounded-2xl !text-sm italic border border-[var(--border-soft)]">
                    "{campaign.email_subject}"
                  </Heading>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-1 bg-[var(--brand-soft)] p-8 rounded-[2rem] border border-[var(--brand-accent)]/20 text-center">
                     <span className="text-[9px] uppercase tracking-widest text-[var(--brand-primary)] mb-2 block font-bold">CÓDIGO DE CUPÓN</span>
                     <span className="text-2xl font-mono text-[var(--brand-primary)] tracking-[0.3em] block font-black">{campaign.coupon_code}</span>
                  </div>
                  <div className="sm:w-1/3 bg-[var(--bg-tertiary)] p-8 rounded-[2rem] border border-[var(--border-soft)] text-center">
                     <span className="text-[9px] uppercase tracking-widest text-[var(--text-disabled)] mb-2 block font-bold">BENEFICIO</span>
                     <span className="text-2xl font-mono text-[var(--text-primary)] tracking-widest block font-black">{campaign.discount_percent}% OFF</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => alert("🚀 ¡Campaña enviada con éxito!")}
                  className="w-full py-5 !rounded-2xl !bg-[var(--text-primary)]"
                >
                  📡 Lanzar Campaña Multicanal
                </Button>
             </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};
