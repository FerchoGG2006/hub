import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Google Fonts injected once ───────────────────────────────────────────────
const injectFonts = () => {
  if (document.getElementById('platorin-fonts')) return;
  const link = document.createElement('link');
  link.id = 'platorin-fonts';
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap';
  document.head.appendChild(link);
};

// ─── Design tokens (same as landing page) ─────────────────────────────────────
const T = {
  cream: '#F5F0E8',
  creamDeep: '#EDE6D6',
  ink: '#1A1208',
  ink50: 'rgba(26,18,8,0.5)',
  ink20: 'rgba(26,18,8,0.2)',
  ink08: 'rgba(26,18,8,0.08)',
  green: '#1A5C36',
  greenLight: '#EAF3EE',
  wa: '#25D366',
  waLight: '#E8F8EF',
  gold: '#C8891A',
  goldLight: '#FBF3E2',
  wompi: '#5F35CD',
  wompiLight: '#F0EBFF',
  border: 'rgba(26,18,8,0.1)',
  white: '#FFFFFF',
};

// ─── Shared style snippets ─────────────────────────────────────────────────────
const fontBase  = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
const fontSerif = { fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' };

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Pill showing which step we're on */
const StepPill = ({ current }) => {
  const steps = ['Iniciando', 'Pagando', 'Verificando', '¡Listo!'];
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {steps.map((label, i) => {
        const idx = i + 1;
        const done    = idx < current;
        const active  = idx === current;
        return (
          <React.Fragment key={idx}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              opacity: done || active ? 1 : 0.3,
              transition: 'opacity 0.3s',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: done ? T.green : active ? T.gold : T.ink08,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: done || active ? '#fff' : T.ink50,
                transition: 'background 0.3s',
                ...fontBase,
              }}>
                {done ? '✓' : idx}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: active ? T.ink : T.ink50, ...fontBase }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 18, height: 1, background: done ? T.green : T.ink08, transition: 'background 0.3s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** Timer badge */
const TimerBadge = ({ timeLeft }) => {
  const urgent = timeLeft < 120;
  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '5px 12px',
      background: urgent ? 'rgba(220,38,38,0.07)' : T.goldLight,
      border: `1px solid ${urgent ? 'rgba(220,38,38,0.15)' : 'rgba(200,137,26,0.2)'}`,
      borderRadius: 99,
      transition: 'all 0.5s',
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: urgent ? '#DC2626' : T.gold,
        animation: urgent ? 'platorin-pulse 1s infinite' : 'none',
      }} />
      <span style={{
        fontSize: 13, fontWeight: 700,
        color: urgent ? '#DC2626' : T.gold,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '0.02em',
        ...fontBase,
      }}>
        {fmt(timeLeft)}
      </span>
    </div>
  );
};

/** Payment method chip */
const MethodChip = ({ label, icon }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '5px 10px',
    background: T.white,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
  }}>
    <span style={{ fontSize: 12 }}>{icon}</span>
    <span style={{ fontSize: 10, fontWeight: 600, color: T.ink50, letterSpacing: '0.04em', ...fontBase }}>{label}</span>
  </div>
);

// ─── Steps ─────────────────────────────────────────────────────────────────────

const Step1Loading = () => (
  <motion.div
    key="step1"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 20 }}
  >
    {/* Animated ring */}
    <div style={{ position: 'relative', width: 72, height: 72 }}>
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        border: `3px solid ${T.goldLight}`,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        border: `3px solid transparent`,
        borderTopColor: T.gold,
        animation: 'platorin-spin 0.8s linear infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
      }}>
        💳
      </div>
    </div>
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 15, fontWeight: 600, color: T.ink, marginBottom: 4, ...fontBase }}>
        Preparando tu pago
      </p>
      <p style={{ fontSize: 13, color: T.ink50, fontWeight: 300, ...fontBase }}>
        Conectando con Wompi de forma segura…
      </p>
    </div>
  </motion.div>
);

const Step2Payment = ({ paymentData, onManualVerify, isMobile }) => (
  <motion.div
    key="step2"
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.97 }}
    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
  >
    {/* Info strip */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      background: T.greenLight,
      borderRadius: 12,
      border: `1px solid rgba(26,92,54,0.1)`,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.wa, flexShrink: 0 }} />
      <p style={{ fontSize: 12, color: T.green, fontWeight: 500, ...fontBase }}>
        Paga con tarjeta, PSE o Nequi. El dinero llega directo a tu cuenta.
      </p>
    </div>

    {/* iFrame / portal */}
    <div style={{
      background: T.white,
      borderRadius: 16,
      overflow: 'hidden',
      border: `1px solid ${T.border}`,
      height: isMobile ? 440 : 500,
      position: 'relative',
    }}>
      {paymentData?.paymentUrl ? (
        <iframe
          src={paymentData.paymentUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Pago con Wompi"
        />
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          background: T.creamDeep,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            border: `3px solid transparent`,
            borderTopColor: T.wompi,
            animation: 'platorin-spin 0.8s linear infinite',
          }} />
          <p style={{ fontSize: 12, color: T.ink50, fontWeight: 300, ...fontBase }}>Cargando pasarela…</p>
        </div>
      )}
    </div>

    {/* CTA */}
    <button
      onClick={onManualVerify}
      style={{
        width: '100%', padding: '14px',
        background: T.ink,
        color: T.white,
        border: 'none', borderRadius: 14,
        fontSize: 13, fontWeight: 700,
        letterSpacing: '0.04em',
        cursor: 'pointer',
        transition: 'opacity 0.2s',
        ...fontBase,
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      Ya pagué — verificar ahora ✓
    </button>
    <p style={{ textAlign: 'center', fontSize: 11, color: T.ink20, fontWeight: 300, marginTop: -8, ...fontBase }}>
      La verificación es automática · también puedes confirmar manualmente
    </p>
  </motion.div>
);

const Step3Verifying = () => (
  <motion.div
    key="step3"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 24 }}
  >
    {/* Orbiting dots */}
    <div style={{ position: 'relative', width: 80, height: 80 }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: `2px solid ${T.goldLight}`,
      }} />
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: `2px solid transparent`,
        borderTopColor: T.gold,
        animation: 'platorin-spin 1.2s linear infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26,
      }}>
        ⏳
      </div>
    </div>
    <div style={{ textAlign: 'center' }}>
      <h4 style={{ fontSize: 20, color: T.ink, marginBottom: 6, lineHeight: 1.2, ...fontSerif }}>
        Validando tu pago
      </h4>
      <p style={{ fontSize: 13, color: T.ink50, fontWeight: 300, lineHeight: 1.6, maxWidth: 260, margin: '0 auto', ...fontBase }}>
        Estamos confirmando con la red bancaria. Esto tarda unos segundos.
      </p>
    </div>
    {/* Animated progress dots */}
    <div style={{ display: 'flex', gap: 6 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: T.gold,
          animation: `platorin-bounce 1.2s ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  </motion.div>
);

const Step4Success = () => (
  <motion.div
    key="step4"
    initial={{ opacity: 0, scale: 0.85 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0 }}
    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 20 }}
  >
    <motion.div
      initial={{ scale: 0, rotate: -15 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
      style={{
        width: 96, height: 96, borderRadius: '50%',
        background: T.green,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 38, color: T.white,
        boxShadow: `0 20px 48px rgba(26,92,54,0.25)`,
      }}
    >
      ✓
    </motion.div>
    <div style={{ textAlign: 'center' }}>
      <motion.h4
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={{ fontSize: 28, color: T.ink, marginBottom: 6, lineHeight: 1, ...fontSerif }}
      >
        ¡Pago confirmado!
      </motion.h4>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        style={{ fontSize: 13, color: T.ink50, fontWeight: 300, ...fontBase }}
      >
        Tu pedido ya está en cocina 🍳
      </motion.p>
    </div>
    {/* Confetti row */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      style={{ display: 'flex', gap: 8, fontSize: 18 }}
    >
      {['🎉', '🍽️', '🎊'].map((e, i) => (
        <motion.span
          key={i}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1, delay: i * 0.15, repeat: Infinity }}
        >
          {e}
        </motion.span>
      ))}
    </motion.div>
  </motion.div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
export const PaymentGatewayModal = ({ isOpen, onClose, onSuccess, orderId }) => {
  const [step, setStep] = useState(1);
  const [paymentData, setPaymentData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(900);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => { injectFonts(); }, []);

  // Effect 1: Init payment session
  useEffect(() => {
    if (!isOpen || !orderId) return;
    const init = async () => {
      if (paymentData) return;
      setStep(1);
      try {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${base}/payments/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, provider: 'wompi' }),
        });
        const data = await res.json();
        setPaymentData(data);
        setStep(2);
      } catch (err) {
        console.error('Error creating payment session:', err);
      }
    };
    init();
  }, [isOpen, orderId, paymentData]);

  // Effect 2: Status monitoring (polling + WS)
  useEffect(() => {
    if (!isOpen || !paymentData?.reference) return;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    let ws = null;

    ws = new WebSocket(base.replace('http', 'ws') + '/ws/menu');
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'ORDER_UPDATED' && data.order_id === orderId && data.status === 'paid') {
        setStep(4);
        clearInterval(poll);
        setTimeout(() => { onSuccess(); onClose(); }, 3000);
      }
    };
    ws.onerror = (e) => console.warn('WS error:', e);

    const poll = setInterval(async () => {
      try {
        const res  = await fetch(`${base}/payments/status/${paymentData.reference}`);
        const data = await res.json();
        if (data.status === 'paid') {
          setStep(4);
          clearInterval(poll);
          setTimeout(() => { onSuccess(); onClose(); }, 3000);
        } else if (data.status === 'failed' || data.status === 'expired') {
          alert('El pago no pudo completarse. Por favor intenta de nuevo.');
          onClose();
        }
      } catch (err) { console.error('Polling error:', err); }
    }, 3000);

    return () => {
      if (ws?.readyState < 2) ws.close();
      clearInterval(poll);
    };
  }, [isOpen, paymentData?.reference, orderId, onSuccess, onClose]);

  // Effect 3: Timer
  useEffect(() => {
    if (!isOpen) return;
    const t = setInterval(() => setTimeLeft(p => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Keyframe injector */}
      <style>{`
        @keyframes platorin-spin    { to { transform: rotate(360deg); } }
        @keyframes platorin-pulse   { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes platorin-bounce  { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
        @keyframes platorin-fadeIn  { from { opacity:0; } to { opacity:1; } }
      `}</style>

      <AnimatePresence>
        {/* Overlay */}
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 400,
            background: 'rgba(26,18,8,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
        >
          {/* Card — stops click propagation */}
          <motion.div
            key="card"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: T.cream,
              borderRadius: isMobile ? 24 : 32,
              width: '100%', maxWidth: 460,
              overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(26,18,8,0.25)',
              position: 'relative',
              ...fontBase,
            }}
          >
            {/* Progress bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: T.creamDeep }}>
              <motion.div
                animate={{ width: `${(step / 4) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{ height: '100%', background: T.gold, borderRadius: 99 }}
              />
            </div>

            {/* Inner padding */}
            <div style={{ padding: isMobile ? '2.25rem 1.15rem 1.5rem' : '2.5rem 2.25rem 2rem' }}>

              {/* ── Top-Right Close Button ── */}
              <button 
                onClick={onClose}
                style={{
                  position: 'absolute', top: 20, right: 20,
                  width: 32, height: 32, borderRadius: '50%',
                  background: T.ink08, border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                  fontSize: 18, color: T.ink,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = T.ink20;
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = T.ink08;
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
              >
                ✕
              </button>

              {/* ── Header ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
                <div>
                  {/* Logo lockup */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10,
                      background: T.wompi,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}>
                      💳
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, lineHeight: 1, ...fontBase }}>
                        Pago seguro
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.wa }} />
                        <span style={{ fontSize: 10, color: T.ink50, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          Procesado por Wompi
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <TimerBadge timeLeft={timeLeft} />
              </div>

              {/* ── Step pills ── */}
              <div style={{ marginBottom: '1.75rem' }}>
                <StepPill current={step} />
              </div>

              {/* ── Step content ── */}
              <div style={{ minHeight: 300 }}>
                <AnimatePresence mode="wait">
                  {step === 1 && <Step1Loading />}
                  {step === 2 && <Step2Payment paymentData={paymentData} onManualVerify={() => setStep(3)} isMobile={isMobile} />}
                  {step === 3 && <Step3Verifying />}
                  {step === 4 && <Step4Success />}
                </AnimatePresence>
              </div>

              {/* ── Footer ── */}
              {step !== 4 && (
                <div style={{
                  marginTop: '1.5rem', paddingTop: '1.25rem',
                  borderTop: `1px solid ${T.border}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  {/* Payment methods */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <MethodChip label="PSE" icon="🏦" />
                    <MethodChip label="Nequi" icon="📱" />
                    <MethodChip label="Tarjeta" icon="💳" />
                  </div>
                  {/* Cancel */}
                  {step < 4 && (
                    <button
                      onClick={onClose}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 13, fontWeight: 700, color: T.ink, // Mayor contraste
                        padding: '6px 12px', borderRadius: 8,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        transition: 'all 0.2s',
                        ...fontBase,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = T.ink08;
                        e.currentTarget.style.color = '#ef4444'; // Rojo al pasar el mouse
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.color = T.ink;
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              )}

              {/* Security note */}
              <p style={{
                marginTop: '0.85rem', textAlign: 'center',
                fontSize: 10, color: T.ink20, fontWeight: 300,
                ...fontBase,
              }}>
                🔒 Conexión cifrada · Platorin nunca almacena datos de tu tarjeta
              </p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default PaymentGatewayModal;
