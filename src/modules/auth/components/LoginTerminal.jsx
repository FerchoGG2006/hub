import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Input, Heading } from '../../../shared/ui';
import { useAuth } from '../useAuth';

export const LoginTerminal = ({ onAuth }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await login(username, password);
      onAuth(data.access_token);
    } catch {
      // Error is handled by the hook
    }
  };

  return (
    <div className="h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 w-full fixed inset-0 z-[200]">
      {/* ─── AMBIENT BACKGROUND GLOWS ─── */}
      <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
         <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] rounded-full blur-[120px] bg-[var(--brand-accent)]/10"></div>
         <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] rounded-full blur-[120px] bg-[var(--brand-primary)]/5"></div>
      </div>
      
      <Card className="relative z-10 w-full max-w-md p-12 !rounded-[2.5rem] shadow-2xl">
        <div className="text-center mb-10">
          <Heading level={1} className="mb-2 text-4xl">Plato<span className="text-[var(--brand-primary)]">rin</span></Heading>
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-accent)] border-b border-[var(--brand-accent)] pb-1 mb-4">
            Acceso Administrativo
          </span>
          <Heading level={2} className="text-2xl mt-4">
            Bienvenido a tu <br/><span className="font-[var(--font-serif)] italic text-[var(--brand-primary)]">Entorno Digital</span>
          </Heading>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <Input 
            label="Usuario o Email"
            placeholder="admin@tu-negocio.com"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input 
            label="Código Passcode"
            type="password"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="tracking-[0.5em]"
          />
          
          {error && (
            <p className="text-[var(--status-error)] text-[10px] text-center uppercase tracking-widest font-bold animate-pulse">
              {error}
            </p>
          )}
          
          <Button 
            type="submit" 
            isLoading={loading}
            className="w-full py-5 text-xs tracking-widest uppercase mt-4"
          >
            Entrar al Panel
          </Button>
        </form>

        <p className="text-center mt-10 text-[10px] text-[var(--text-disabled)] uppercase tracking-widest leading-loose">
          Si olvidaste tu acceso, solicita ayuda <br/> a soporte vía <a href="#" className="text-[#25D366] font-bold">WhatsApp</a>
        </p>
      </Card>
    </div>
  );
};
