import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/* ── CONSTANTES ── */
const EVENT_TYPES = [
  { key: 'cumpleanos', icon: '🎂', label: 'Cumpleaños' },
  { key: 'aniversario', icon: '💍', label: 'Aniversario' },
  { key: 'reunion', icon: '🤝', label: 'Reunión' },
  { key: 'despedida', icon: '🥂', label: 'Despedida' },
  { key: 'otro', icon: '✨', label: 'Otro' },
];

const EXTRAS_OPTIONS = [
  { key: 'decoracion', icon: '🎈', label: 'Decoración especial' },
  { key: 'torta', icon: '🎂', label: 'Torta incluida' },
  { key: 'zona_privada', icon: '🔒', label: 'Zona privada' },
  { key: 'menu_especial', icon: '📋', label: 'Menú especial' },
  { key: 'musica', icon: '🎵', label: 'Música' },
];

/* ── STEP INDICATOR ── */
const StepIndicator = ({ step, total }) => (
  <div className="flex items-center justify-center gap-2 mb-8">
    {Array.from({ length: total }).map((_, i) => (
      <motion.div
        key={i}
        animate={{ 
          width: i === step ? 32 : 8,
          opacity: i <= step ? 1 : 0.3
        }}
        className="h-2 rounded-full"
        style={{ 
          background: i <= step 
            ? 'linear-gradient(to right, #FCD34D, #F59E0B)' 
            : 'rgba(255,255,255,0.15)' 
        }}
      />
    ))}
  </div>
);

/* ── STEP 1: TIPO DE EVENTO ── */
const Step1EventType = ({ value, onChange }) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
    className="space-y-6"
  >
    <div className="text-center mb-8">
      <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-2">
        ¿Qué celebras?
      </h3>
      <p className="text-white/30 text-[10px] uppercase tracking-[0.3em]">Selecciona el tipo de evento</p>
    </div>
    <div className="grid grid-cols-2 gap-3">
      {EVENT_TYPES.map((t) => (
        <motion.button
          key={t.key}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(t.key)}
          className={`p-5 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
            value === t.key
              ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
              : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
          }`}
        >
          <span className="text-3xl">{t.icon}</span>
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
            value === t.key ? 'text-amber-400' : 'text-white/50'
          }`}>{t.label}</span>
        </motion.button>
      ))}
    </div>
  </motion.div>
);

/* ── STEP 2: DETALLES ── */
const Step2Details = ({ data, onChange }) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
    className="space-y-6"
  >
    <div className="text-center mb-6">
      <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-2">
        Detalles
      </h3>
      <p className="text-white/30 text-[10px] uppercase tracking-[0.3em]">Cuéntanos sobre tu evento</p>
    </div>

    <div className="space-y-4">
      <div>
        <label className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-bold mb-2 block">Fecha del evento</label>
        <input
          type="datetime-local"
          value={data.event_date}
          onChange={(e) => onChange({ ...data, event_date: e.target.value })}
          className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3.5 px-4 text-white text-sm outline-none focus:border-amber-500/50 transition-colors [color-scheme:dark]"
        />
      </div>

      <div>
        <label className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-bold mb-2 block">Número de personas</label>
        <input
          type="number"
          min="1"
          max="500"
          value={data.guests_count}
          onChange={(e) => onChange({ ...data, guests_count: e.target.value })}
          placeholder="Ej: 20"
          className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3.5 px-4 text-white text-sm outline-none focus:border-amber-500/50 transition-colors placeholder-white/20"
        />
      </div>

      <div>
        <label className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-bold mb-2 block">Homenajeado (opcional)</label>
        <input
          type="text"
          value={data.honoree}
          onChange={(e) => onChange({ ...data, honoree: e.target.value })}
          placeholder="Nombre del cumpleañero, pareja..."
          className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3.5 px-4 text-white text-sm outline-none focus:border-amber-500/50 transition-colors placeholder-white/20"
        />
      </div>
    </div>
  </motion.div>
);

/* ── STEP 3: EXTRAS ── */
const Step3Extras = ({ selected, onChange }) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
    className="space-y-6"
  >
    <div className="text-center mb-6">
      <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-2">
        Extras
      </h3>
      <p className="text-white/30 text-[10px] uppercase tracking-[0.3em]">Personaliza tu experiencia</p>
    </div>

    <div className="space-y-3">
      {EXTRAS_OPTIONS.map((extra) => {
        const isChecked = selected.includes(extra.key);
        return (
          <motion.button
            key={extra.key}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (isChecked) {
                onChange(selected.filter(k => k !== extra.key));
              } else {
                onChange([...selected, extra.key]);
              }
            }}
            className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all ${
              isChecked
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
            }`}
          >
            <span className="text-2xl">{extra.icon}</span>
            <span className={`text-xs font-bold uppercase tracking-wider flex-1 text-left ${
              isChecked ? 'text-amber-400' : 'text-white/60'
            }`}>{extra.label}</span>
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
              isChecked 
                ? 'bg-amber-500 border-amber-500' 
                : 'border-white/20'
            }`}>
              {isChecked && <span className="text-black text-xs font-black">✓</span>}
            </div>
          </motion.button>
        );
      })}
    </div>
  </motion.div>
);

/* ── STEP 4: CONTACTO ── */
const Step4Contact = ({ data, onChange }) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
    className="space-y-6"
  >
    <div className="text-center mb-6">
      <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-2">
        Contacto
      </h3>
      <p className="text-white/30 text-[10px] uppercase tracking-[0.3em]">¿Cómo te contactamos?</p>
    </div>

    <div className="space-y-4">
      <div>
        <label className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-bold mb-2 block">Nombre completo</label>
        <input
          type="text"
          value={data.client_name}
          onChange={(e) => onChange({ ...data, client_name: e.target.value })}
          placeholder="Tu nombre"
          className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3.5 px-4 text-white text-sm outline-none focus:border-amber-500/50 transition-colors placeholder-white/20"
        />
      </div>

      <div>
        <label className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-bold mb-2 block">WhatsApp</label>
        <div className="flex gap-2">
          <div className="bg-white/[0.05] border border-white/10 rounded-xl py-3.5 px-4 text-white/60 text-sm flex-shrink-0 select-none">
            +57
          </div>
          <input
            type="tel"
            value={data.client_phone}
            onChange={(e) => onChange({ ...data, client_phone: e.target.value })}
            placeholder="300 123 4567"
            className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl py-3.5 px-4 text-white text-sm outline-none focus:border-amber-500/50 transition-colors placeholder-white/20"
          />
        </div>
      </div>

      <div>
        <label className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-bold mb-2 block">Mensaje adicional</label>
        <textarea
          value={data.notes}
          onChange={(e) => onChange({ ...data, notes: e.target.value })}
          placeholder="Cuéntanos cualquier detalle extra sobre tu evento..."
          rows={4}
          className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3.5 px-4 text-white text-sm outline-none focus:border-amber-500/50 transition-colors resize-none placeholder-white/20"
        />
      </div>
    </div>
  </motion.div>
);

/* ── STEP 5: CONFIRMACIÓN ── */
const Step5Confirm = ({ formData }) => {
  const typeLabel = EVENT_TYPES.find(t => t.key === formData.event_type)?.label || formData.event_type;
  const typeIcon = EVENT_TYPES.find(t => t.key === formData.event_type)?.icon || '✨';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-2">
          Confirmar
        </h3>
        <p className="text-white/30 text-[10px] uppercase tracking-[0.3em]">Revisa tu solicitud</p>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-white/5">
          <span className="text-3xl">{typeIcon}</span>
          <div>
            <p className="text-white font-bold text-sm">{typeLabel}</p>
            <p className="text-white/30 text-[10px] uppercase tracking-widest">Tipo de evento</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-white/30 text-[9px] uppercase tracking-wider mb-1">Fecha</p>
            <p className="text-white font-medium">
              {formData.event_date 
                ? new Date(formData.event_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'Por definir'}
            </p>
          </div>
          <div>
            <p className="text-white/30 text-[9px] uppercase tracking-wider mb-1">Personas</p>
            <p className="text-white font-medium">{formData.guests_count || 1}</p>
          </div>
        </div>

        {formData.extras.length > 0 && (
          <div>
            <p className="text-white/30 text-[9px] uppercase tracking-wider mb-2">Extras</p>
            <div className="flex flex-wrap gap-2">
              {formData.extras.map(key => {
                const extra = EXTRAS_OPTIONS.find(e => e.key === key);
                return (
                  <span key={key} className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full font-bold">
                    {extra?.icon} {extra?.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-white/5 space-y-2">
          <div className="flex justify-between">
            <span className="text-white/30 text-[9px] uppercase tracking-wider">Contacto</span>
            <span className="text-white text-xs font-medium">{formData.client_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/30 text-[9px] uppercase tracking-wider">WhatsApp</span>
            <span className="text-white text-xs font-medium">+57 {formData.client_phone}</span>
          </div>
          {formData.notes && (
            <div className="pt-2">
              <p className="text-white/30 text-[9px] uppercase tracking-wider mb-1">Notas</p>
              <p className="text-white/60 text-xs italic">{formData.notes}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ── SUCCESS SCREEN ── */
const SuccessScreen = ({ eventId, onClose }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center text-center py-10 space-y-6"
  >
    <motion.div
      initial={{ scale: 0 }} animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
      className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center"
    >
      <span className="text-5xl">🎉</span>
    </motion.div>
    
    <div>
      <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-2">
        ¡Solicitud Enviada!
      </h3>
      <p className="text-white/40 text-xs leading-relaxed max-w-xs">
        Tu solicitud fue recibida exitosamente. El restaurante te contactará pronto por WhatsApp.
      </p>
    </div>

    <div className="bg-white/[0.05] border border-white/10 rounded-2xl py-4 px-8">
      <p className="text-[9px] text-white/30 uppercase tracking-[0.3em] mb-1">Nº de solicitud</p>
      <p className="text-2xl font-black text-amber-400 font-mono">#{eventId}</p>
    </div>

    <button
      onClick={onClose}
      className="mt-4 py-4 px-12 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] bg-white text-black transition-all active:scale-95"
    >
      Cerrar
    </button>
  </motion.div>
);

/* ════════════════════════════════════════════
   MAIN WIZARD COMPONENT
   ════════════════════════════════════════════ */
export const EventWizard = ({ slug, onClose }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [eventId, setEventId] = useState(null);

  const [formData, setFormData] = useState({
    event_type: '',
    event_date: '',
    guests_count: '10',
    honoree: '',
    extras: [],
    client_name: '',
    client_phone: '',
    notes: '',
  });

  const TOTAL_STEPS = 5;

  const canAdvance = () => {
    switch (step) {
      case 0: return !!formData.event_type;
      case 1: return !!formData.event_date && !!formData.guests_count;
      case 2: return true; // extras are optional
      case 3: return !!formData.client_name && !!formData.client_phone;
      case 4: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const phone = formData.client_phone.replace(/\s/g, '');
      const fullPhone = phone.startsWith('+') ? phone : `+57${phone}`;

      // Include honoree in notes if provided
      let finalNotes = formData.notes || '';
      if (formData.honoree) {
        finalNotes = `Homenajeado: ${formData.honoree}. ${finalNotes}`;
      }

      const res = await fetch(`${API_URL}/api/events/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: formData.client_name,
          client_phone: fullPhone,
          event_type: formData.event_type,
          event_date: formData.event_date ? new Date(formData.event_date).toISOString() : null,
          guests_count: parseInt(formData.guests_count) || 1,
          extras: formData.extras,
          notes: finalNotes,
        })
      });

      if (!res.ok) throw new Error('Error al enviar solicitud');
      const data = await res.json();
      setEventId(data.event_id);
      setSuccess(true);
    } catch (err) {
      alert('Error al enviar la solicitud. Intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === TOTAL_STEPS - 1) {
      handleSubmit();
    } else {
      setStep(s => s + 1);
    }
  };

  const prevStep = () => setStep(s => Math.max(0, s - 1));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

      {/* Content */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative z-10 w-full max-w-md bg-[#0A0A0A] rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-md px-6 pt-6 pb-2 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎉</span>
              <h2 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em]">Evento Especial</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors text-sm"
            >
              ✕
            </button>
          </div>
          {!success && <StepIndicator step={step} total={TOTAL_STEPS} />}
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-4 min-h-[400px]">
          {success ? (
            <SuccessScreen eventId={eventId} onClose={onClose} />
          ) : (
            <>
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <Step1EventType
                    key="s1"
                    value={formData.event_type}
                    onChange={(v) => setFormData({ ...formData, event_type: v })}
                  />
                )}
                {step === 1 && (
                  <Step2Details
                    key="s2"
                    data={formData}
                    onChange={(d) => setFormData(d)}
                  />
                )}
                {step === 2 && (
                  <Step3Extras
                    key="s3"
                    selected={formData.extras}
                    onChange={(ex) => setFormData({ ...formData, extras: ex })}
                  />
                )}
                {step === 3 && (
                  <Step4Contact
                    key="s4"
                    data={formData}
                    onChange={(d) => setFormData(d)}
                  />
                )}
                {step === 4 && (
                  <Step5Confirm key="s5" formData={formData} />
                )}
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex gap-3 mt-8 pb-2">
                {step > 0 && (
                  <button
                    onClick={prevStep}
                    className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/10 transition-colors text-lg"
                  >
                    ←
                  </button>
                )}
                <button
                  onClick={nextStep}
                  disabled={!canAdvance() || loading}
                  className={`flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all active:scale-[0.98] ${
                    canAdvance()
                      ? 'bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.15)]'
                      : 'bg-white/5 text-white/20 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="inline-block">⏳</motion.span>
                      Enviando...
                    </span>
                  ) : step === TOTAL_STEPS - 1 ? (
                    '✦ Enviar Solicitud'
                  ) : (
                    'Continuar →'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
