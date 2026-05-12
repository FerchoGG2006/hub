import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, Heading, Button, Badge } from '../../../shared/ui';
import { PhoneInput } from './PhoneInput';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const BrandingSettings = () => {
  const { tenantSlug } = useParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    brand_color: '#C8891A',
    whatsapp_number: '',
    tiktok_url: '',
  });

  useEffect(() => {
      fetch(`${API_URL}/api/v1/tenant/${tenantSlug}`)
      .then(r => r.json())
      .then(json => {
        const d = json.data || json;
        setFormData({
          brand_color: d.brand_color || '#C8891A',
          whatsapp_number: d.whatsapp_number || '',
          tiktok_url: d.tiktok_url || ''
        });
      })
      .catch(e => console.warn(e));
  }, [tenantSlug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/tenant/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Guardado falló");
      alert("Identidad visual actualizada.");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto py-0">
      <header className="border-b border-[var(--border-soft)] pb-10 mb-8">
        <Badge variant="brand" className="mb-2">Identidad de Marca</Badge>
        <Heading level={2}>Personalizar <span className="font-[var(--font-serif)] italic">Experiencia</span></Heading>
        <p className="text-[var(--text-muted)] text-sm mt-1">Define el ADN visual que tus clientes verán en su terminal.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <form onSubmit={handleSubmit} className="space-y-10">
          <Card className="space-y-8 !rounded-[2rem]">
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)] ml-2 mb-1 block">
                Color de Acento (Botones)
              </label>
              <div className="flex items-center gap-6 p-5 bg-[var(--bg-secondary)]/50 rounded-2xl border border-[var(--border-soft)]">
                <input 
                  type="color" 
                  value={formData.brand_color} 
                  onChange={(e) => setFormData({...formData, brand_color: e.target.value})} 
                  className="w-16 h-16 rounded-xl cursor-pointer border-none p-0"
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">{formData.brand_color}</p>
                  <p className="text-[11px] text-[var(--text-disabled)]">Este color se usará en botones y detalles del menú.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)] ml-2 mb-1 block">
                WhatsApp de Pedidos
              </label>
              <PhoneInput 
                value={formData.whatsapp_number} 
                onChange={(val) => setFormData({...formData, whatsapp_number: val})} 
                placeholder="Ej: +57 300..."
              />
            </div>
          </Card>

          <Button type="submit" isLoading={loading} className="w-full py-5 text-xs uppercase tracking-[0.2em]">
            Aplicar Identidad Visual
          </Button>
        </form>

        <div className="sticky top-32">
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[var(--text-disabled)] text-center mb-6">Previsualización Live</p>
          <div className="phone-outer mx-auto shadow-2xl" style={{ width: '260px', height: '540px', borderRadius: '40px', border: '12px solid var(--text-primary)', overflow: 'hidden' }}>
            <div className="phone-screen bg-[var(--bg-primary)] h-full flex flex-col p-6 pt-12">
               <div className="h-2 w-12 rounded-full mb-6" style={{ background: formData.brand_color }} />
               <h4 className="font-[var(--font-serif)] italic text-2xl text-[var(--text-primary)] mb-2">{tenantSlug}</h4>
               <div className="space-y-4 mt-8">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex gap-3 opacity-10">
                      <div className="w-10 h-10 bg-[var(--text-primary)] rounded-lg" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-2 w-full bg-[var(--text-primary)] rounded" />
                        <div className="h-1.5 w-1/2 bg-[var(--text-primary)] rounded" />
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
