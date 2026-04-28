import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  {
    title: "Bienvenido al Futuro",
    description: "Has activado el Tech Gastro Hub. Este es tu centro de mando para dominar el mercado gastronómico con IA.",
    icon: "🚀",
    target: "sidebar"
  },
  {
    title: "Gestión de Inventario",
    description: "Crea platos, define alérgenos y deja que nuestra IA redacte descripciones persuasivas que vendan por ti.",
    icon: "🍔",
    target: "inventory-tab"
  },
  {
    title: "Live Simulator",
    description: "Personaliza tu marca y observa los cambios en tiempo real en un iPhone virtual. Lo que ves es lo que tus clientes aman.",
    icon: "📱",
    target: "branding-tab"
  },
  {
    title: "Piloto Automático",
    description: "Conecta Instagram y TikTok. Nosotros actualizamos tu biografía automáticamente cuando abres o cierras.",
    icon: "🤖",
    target: "autopilot-tab"
  },
  {
    title: "Todo Listo",
    description: "Genera tus códigos QR, imprime tu menú y empieza a recibir órdenes en tiempo real.",
    icon: "✨",
    target: "qr-tab"
  }
];

export const OnboardingTour = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
      {/* Background Overlay */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 shadow-[0_50px_100px_rgba(0,0,0,1)] overflow-hidden"
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
            />
          </div>

          <div className="text-center">
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-8 border border-white/10"
            >
              {steps[currentStep].icon}
            </motion.div>

            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4 italic">
              {steps[currentStep].title}
            </h3>
            
            <p className="text-white/50 text-sm leading-relaxed mb-10 font-light italic">
              {steps[currentStep].description}
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={nextStep}
                className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
              >
                {currentStep === steps.length - 1 ? "Comenzar ahora" : "Siguiente Paso"}
              </button>
              
              {currentStep < steps.length - 1 && (
                <button 
                  onClick={onComplete}
                  className="text-[9px] uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
                >
                  Omitir tutorial
                </button>
              )}
            </div>
          </div>

          {/* Step Indicator */}
          <div className="mt-8 flex justify-center gap-1.5">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 rounded-full transition-all duration-500 ${i === currentStep ? 'w-6 bg-amber-500' : 'w-2 bg-white/10'}`} 
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
