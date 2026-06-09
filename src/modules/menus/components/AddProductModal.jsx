import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Heading, Button, Input, Modal } from '../../../shared/ui';
import { ProductCell } from '../../tenants/components/ProductCell';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const AddProductModal = ({ isOpen, onClose, onProductAdded, businessType }) => {
  const { tenantSlug } = useParams();
  const [formData, setFormData] = useState({ name: '', price: '', desc: '', emoji: '🍽️', category: '' });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API_URL}/api/v1/tenant/${tenantSlug}/categories`)
      .then(r => r.json())
      .then(data => { 
        setCats(data); 
        if (data.length && !formData.category) setFormData(f => ({ ...f, category: String(data[0].id) })); 
      })
      .catch(() => setCats([{ id: 1, name: 'Entradas' }, { id: 2, name: 'Fuertes' }, { id: 3, name: 'Licores' }]));
  }, [tenantSlug, isOpen, formData.category]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
       setFile(selected);
       setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleMagicEdit = async () => {
    if (!formData.name) return alert("Escribe un nombre base primero (ej: Hamburguesa)");
    setAiGenerating(true);
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/magic-edit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ name: formData.name, price: formData.price, desc: formData.desc })
      });
      if (!res.ok) throw new Error("Error en Magic AI Edit");
      const data = await res.json();
      setFormData(f => ({
        ...f,
        name: data.name,
        desc: data.desc,
        price: data.price,
        emoji: data.emoji
      }));
    } catch (err) {
      alert("Error en Magic Edit: " + err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    data.append('name', formData.name);
    data.append('price', formData.price);
    data.append('desc', formData.desc);
    data.append('emoji', formData.emoji);
    data.append('category_id', formData.category);
    if (file) data.append('image', file);

    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/products`, { 
        method: 'POST', 
        body: data,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error saving');
      onProductAdded();
      onClose();
    } catch (err) {
      alert("Error al subir el producto: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="!max-w-5xl h-[95vh] sm:h-auto overflow-visible">
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Editor de Contenido */}
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center mb-6">
            <Heading level={3} className="!text-amber-500 italic uppercase tracking-tighter">
              {businessType === 'rental' ? 'Nuevo Equipo' : (businessType === 'service' ? 'Nuevo Servicio' : 'Nuevo Producto')}
            </Heading>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleMagicEdit} 
              isLoading={aiGenerating}
              className="!text-indigo-600 !border-indigo-500/20 !bg-indigo-500/5 hover:!bg-indigo-500/10"
            >
               🪄 Mejorar con IA
            </Button>
          </div>

          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[9px] uppercase tracking-[0.2em] text-[var(--text-disabled)] block mb-2 font-bold ml-2">
                {businessType === 'service' ? 'Imagen del servicio' : 'Imagen del producto'}
              </label>
              <input type="file" accept="image/*" onChange={handleFileChange}
                className="w-full text-xs file:bg-[var(--bg-secondary)] file:text-[var(--text-muted)] file:border file:border-[var(--border-soft)] file:px-4 file:py-2 file:rounded-full file:font-bold file:cursor-pointer" />
            </div>

            <div className="flex gap-3">
              <input value={formData.emoji} onChange={e => setFormData({ ...formData, emoji: e.target.value })}
                className="w-14 text-center text-xl bg-[var(--bg-secondary)] border-b border-[var(--border-soft)] py-3 outline-none focus:border-[var(--brand-accent)] transition-colors rounded-t-xl" />
              <input placeholder={businessType === 'rental' ? "Nombre del Equipo" : (businessType === 'service' ? "Nombre del Servicio" : "Nombre del Plato")} required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="flex-1 bg-transparent border-b border-[var(--border-soft)] py-3 text-sm outline-none focus:border-[var(--brand-accent)] transition-colors placeholder-[var(--text-disabled)] text-[var(--text-primary)] font-medium" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input placeholder={businessType === 'rental' ? "Tarifa diaria (EJ: $25k)" : "Precio (EJ: $25k)"} required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })}
                className="bg-transparent border-b border-[var(--border-soft)] py-3 text-sm outline-none focus:border-[var(--brand-accent)] transition-colors placeholder-[var(--text-disabled)] text-[var(--text-primary)] font-mono" />
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="bg-transparent border-b border-[var(--border-soft)] py-3 text-sm outline-none focus:border-[var(--brand-accent)] transition-colors text-[var(--text-muted)] appearance-none">
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <textarea placeholder={businessType === 'service' ? "Describe en qué consiste el servicio..." : "Describe el artículo o plato..."} value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-soft)] p-4 rounded-2xl text-xs h-32 outline-none focus:border-[var(--brand-accent)] transition-colors resize-none placeholder-[var(--text-disabled)] text-[var(--text-primary)]" />
          </form>
        </div>

        {/* Simulador iOS (Live Preview) */}
        <div className="hidden sm:flex flex-col items-center justify-center bg-[var(--bg-secondary)]/50 p-6 border border-[var(--border-soft)] rounded-[2.5rem] relative overflow-hidden flex-shrink-0 w-[400px]">
           <div className="absolute top-4 left-4 flex gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400"></div><div className="w-2 h-2 rounded-full bg-amber-400"></div><div className="w-2 h-2 rounded-full bg-emerald-400"></div></div>
           <p className="text-[9px] uppercase tracking-widest text-[var(--text-disabled)] font-black mb-6 absolute top-4">Vista previa en tiempo real</p>
           
           <div className="w-[320px] rounded-[3rem] border-[10px] border-[var(--text-primary)] bg-[var(--bg-primary)] overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[var(--text-primary)] rounded-b-3xl z-50"></div>
              
              <div className="p-4 pt-10 min-h-[160px] flex items-center justify-center relative z-10">
                <div className="w-full pointer-events-none">
                  <ProductCell item={{
                     name: formData.name || 'Tu Producto',
                     price: formData.price || '$0k',
                     desc: formData.desc || 'Descripción visualizada en tiempo real según cómo lo verá el cliente.',
                     emoji: formData.emoji || '🍽️',
                     image_url: previewUrl
                  }} onAdd={()=>{}} />
                </div>
              </div>
           </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-center">
        <Button type="submit" form="product-form" isLoading={loading} className="w-full max-w-sm py-5 !rounded-2xl">
          Guardar {businessType === 'rental' ? 'Equipo' : (businessType === 'service' ? 'Servicio' : 'Producto')}
        </Button>
      </div>
    </Modal>
  );
};
