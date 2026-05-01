import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

export const ProductCustomizer = ({ item, isOpen, onClose, onSave }) => {
  const [removed, setRemoved] = useState(item.customizations?.removed || []);
  const [note, setNote] = useState(item.customizations?.note || "");

  const toggleIngredient = (ing) => {
    setRemoved(prev => 
      prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
    );
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleSave = () => {
    onSave({ removed, note });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-dark/60 backdrop-blur-md"
          onClick={onClose}
        >
          <Motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-lg bg-bone rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-dark/10 p-8 pt-10 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar for mobile */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-dark/10 rounded-full sm:hidden" />

            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black text-dark italic uppercase tracking-tighter mb-1">
                  {item.name}
                </h3>
                <p className="text-[10px] text-dark/40 uppercase tracking-[0.2em] font-bold">Personalizar Plato</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-dark/5 flex items-center justify-center text-dark/40 hover:text-dark"
              >
                ✕
              </button>
            </div>

            <div className="space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
              {/* Ingredients section */}
              <div>
                <label className="text-[10px] text-dark/30 uppercase tracking-[0.25em] block mb-4 font-black">Remover Ingredientes</label>
                <div className="flex flex-wrap gap-2">
                  {item.baseIngredients?.map(ing => {
                    const isRemoved = removed.includes(ing);
                    return (
                      <Motion.button
                        key={ing}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => toggleIngredient(ing)}
                        className={`px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all flex items-center gap-2`}
                        style={{
                          background: isRemoved ? 'rgba(239, 68, 68, 0.1)' : 'rgba(26,26,26,0.05)',
                          borderColor: isRemoved ? 'rgba(239, 68, 68, 0.4)' : 'rgba(26,26,26,0.1)',
                          color: isRemoved ? '#ef4444' : 'rgba(26,26,26,0.6)',
                          textDecoration: isRemoved ? 'line-through' : 'none'
                        }}
                      >
                        {isRemoved ? '✕' : '✓'} {ing}
                      </Motion.button>
                    );
                  })}
                </div>
                <p className="text-[9px] text-dark/20 mt-3 font-medium uppercase tracking-widest italic">Toca para desactivar un ingrediente</p>
              </div>

              {/* Note section */}
              <div>
                <label className="text-[10px] text-dark/30 uppercase tracking-[0.25em] block mb-4 font-black">Comentarios Extras</label>
                <textarea 
                  placeholder="Ej: Término medio, sin sal, bien cocido..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-dark/5 border border-dark/10 rounded-3xl p-5 text-sm outline-none focus:border-amber-500 transition-colors placeholder-dark/10 text-dark min-h-[120px] resize-none"
                />
              </div>
            </div>

            <div className="pt-8 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-dark/30 border border-dark/10"
              >
                Cerrar
              </button>
              <button 
                onClick={handleSave}
                className="flex-[2] py-4 bg-dark text-bone rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-amber-500 transition-all"
              >
                Guardar Cambios
              </button>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
};
