import React from 'react';
import { motion } from 'framer-motion';
import { Card, Heading, Badge, EmptyState, Button } from '../../../shared/ui';

export const InventoryManager = ({ products, toggleProduct, magicSnap }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--border-soft)] pb-10">
        <div>
          <Badge variant="brand" className="mb-2">Catálogo de productos</Badge>
          <Heading level={2}>Mi <span className="font-[var(--font-serif)] italic">Carta Digital</span></Heading>
          <p className="text-[var(--text-muted)] text-sm mt-1">Gestiona tus platos, precios y disponibilidad en tiempo real.</p>
        </div>
        <div className="flex gap-4">
           <label className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border border-[var(--brand-accent)]/20 rounded-[var(--radius-xl)] font-semibold text-sm hover:bg-[var(--brand-accent)]/20 cursor-pointer transition-all active:scale-95">
              <span className="text-xl">📸</span>
              <span>Foto-Plato (IA)</span>
              <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                 try {
                   await magicSnap(file);
                   alert("✅ ¡Plato creado mágicamente!");
                 } catch { alert("Error en el análisis visual."); }
               }} />
           </label>
        </div>
      </header>
      
      {products.length === 0 ? (
        <EmptyState 
          icon="🍳"
          title="Tu carta está vacía"
          description="Empieza subiendo una foto de tus platos o agrégalos manualmente."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((item) => (
            <Card key={item.id} className="group hover:border-[var(--brand-accent)]/30 transition-all !p-5 flex items-center gap-5">
              <div className={`w-20 h-20 rounded-2xl bg-[var(--bg-secondary)] overflow-hidden border border-[var(--border-soft)] ${!item.is_available ? 'grayscale opacity-40' : 'group-hover:scale-105 transition-transform'}`}>
                {item.image || item.image_url ? (
                  <img src={item.image || item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">🍽️</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Heading level={4} className={`!text-sm uppercase tracking-wider truncate ${!item.is_available ? 'text-[var(--text-disabled)] line-through' : ''}`}>
                  {item.name}
                </Heading>
                <p className="font-[var(--font-serif)] italic text-lg text-[var(--text-primary)]">
                  ${String(item.price || 0).replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                </p>
                
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant={item.is_available ? 'success' : 'error'}>
                    {item.is_available ? 'En carta' : 'Agotado'}
                  </Badge>
                  <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" className="sr-only peer" checked={item.is_available} onChange={() => toggleProduct(item.id)} />
                    <div className="w-9 h-5 bg-[var(--text-disabled)] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--brand-primary)]"></div>
                  </label>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
};
