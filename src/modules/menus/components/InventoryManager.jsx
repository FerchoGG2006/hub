import React from 'react';
import { motion } from 'framer-motion';
import { Card, Heading, Badge, EmptyState, Button } from '../../../shared/ui';

import { AddProductModal } from './AddProductModal';

export const InventoryManager = ({ products, toggleProduct, magicSnap, updateImage, config }) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  const isRental = config?.business_type === 'rental';
  const isService = config?.business_type === 'service';
  
  const title = isRental ? "Inventario" : (isService ? "Servicios" : "Carta Digital");
  const subtitle = isRental ? "Gestiona tus equipos y disponibilidad." : (isService ? "Gestiona tus servicios." : "Gestiona tus platos, precios y disponibilidad en tiempo real.");
  const emptyTitle = isRental ? "Tu inventario está vacío" : (isService ? "No hay servicios" : "Tu carta está vacía");
  const emptyDesc = isRental ? "Empieza agregando tus equipos de alquiler." : (isService ? "Agrega los servicios que ofreces." : "Empieza subiendo una foto de tus platos o agrégalos manualmente.");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--border-soft)] pb-10">
        <div>
          <Badge variant="brand" className="mb-2">Catálogo</Badge>
          <Heading level={2}>Mi <span className="font-[var(--font-serif)] italic">{title}</span></Heading>
          <p className="text-[var(--text-muted)] text-sm mt-1">{subtitle}</p>
        </div>
        <div className="flex gap-4">
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            + Agregar
          </Button>
           <label className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border border-[var(--brand-accent)]/20 rounded-[var(--radius-xl)] font-semibold text-sm hover:bg-[var(--brand-accent)]/20 cursor-pointer transition-all active:scale-95">
              <span className="text-xl">📸</span>
              <span>Foto-Plato (IA)</span>
              <input type="file" className="hidden" accept="image/*" multiple onChange={async (e) => {
                const files = Array.from(e.target.files);
                if (files.length === 0) return;
                 try {
                   await magicSnap(files);
                   alert(`✅ ¡${files.length} imágenes procesadas mágicamente!`);
                 } catch { alert("Error en el análisis visual."); }
               }} />
           </label>
        </div>
      </header>
      
      {products.length === 0 ? (
        <EmptyState 
          icon={isService ? "🛠️" : (isRental ? "📦" : "🍳")}
          title={emptyTitle}
          description={emptyDesc}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((item) => (
            <Card key={item.id} className="group hover:border-[var(--brand-accent)]/30 transition-all !p-5 flex items-center gap-5">
              <label className={`relative w-20 h-20 rounded-2xl bg-[var(--bg-secondary)] overflow-hidden border border-[var(--border-soft)] cursor-pointer group/img ${!item.is_available ? 'grayscale opacity-40' : 'hover:scale-105 transition-transform'}`}>
                {item.image || item.image_url ? (
                  <img src={item.image || item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">🍽️</div>
                )}
                
                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                  <span className="text-white text-xl">📸</span>
                </div>

                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file && updateImage) {
                      try {
                        await updateImage(item.id, file);
                      } catch {
                        alert("Error al subir la imagen");
                      }
                    }
                  }}
                />
              </label>
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
      
      <AddProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onProductAdded={() => { window.location.reload(); }} 
        businessType={config?.business_type}
      />
    </motion.div>
  );
};
