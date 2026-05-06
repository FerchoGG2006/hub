import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const RegisterBusiness = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        brand_color: '#C5A862',
        whatsapp_number: '',
        email: '',
        file: null
    });

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('slug', formData.slug);
            data.append('brand_color', formData.brand_color);
            data.append('whatsapp_number', formData.whatsapp_number);
            data.append('email', formData.email);
            data.append('file', formData.file);

            const res = await fetch(`${API_URL}/api/admin/onboard`, {
                method: 'POST',
                body: data,
                // Note: Auth token should be passed if we keep superadmin requirement, 
                // but for "Automatic Distribution" we might use a public invite key.
                // For now, I'll use the local token if available.
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('hub_token')}`
                }
            });

            if (!res.ok) throw new Error("Error en activación");
            const json = await res.json();
            setResult(json);
            setStep(4);
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (step === 4 && result) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/5 border border-white/10 rounded-[3rem] p-12 max-w-xl w-full text-center space-y-8 backdrop-blur-3xl shadow-2xl">
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                        <span className="text-5xl">🚀</span>
                    </div>
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">¡Negocio Activado!</h2>
                    <p className="text-white/40 text-sm">Hemos creado tu entorno digital y procesado tu menú con Inteligencia Artificial.</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-left">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Usuario Admin</p>
                            <p className="text-sm font-bold text-white">{result.credentials.user}</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Passcode</p>
                            <p className="text-xl font-black text-amber-500 font-mono tracking-widest">{result.credentials.passcode}</p>
                        </div>
                    </div>

                    <a href={`/admin/${formData.slug}`} className="block w-full py-5 bg-white text-black font-black uppercase text-xs tracking-[0.3em] rounded-2xl shadow-xl hover:scale-[1.02] transition-transform">
                        Entrar al Dashboard
                    </a>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center p-6 selection:bg-amber-500 selection:text-black">
            {/* Ambient background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-lg relative z-10">
                <div className="mb-12 text-center">
                    <h1 className="text-6xl font-black italic tracking-tighter mb-2">HUB <span className="text-amber-500">SaaS</span></h1>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-white/30">Activate your business in 10 minutes</p>
                </div>

                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                        <motion.div className="h-full bg-amber-500" animate={{ width: `${(step/3)*100}%` }} />
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <h3 className="text-2xl font-bold mb-8">Identidad Digital</h3>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Nombre del Negocio</label>
                                    <input type="text" placeholder="Ej: El Fogón Dorado" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:border-amber-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">URL Personalizada (Slug)</label>
                                    <input type="text" placeholder="ej: el-fogon-dorado" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s/g, '-')})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:border-amber-500 outline-none transition-all font-mono" />
                                </div>
                                <button onClick={handleNext} disabled={!formData.name || !formData.slug} className="w-full py-5 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl mt-8 disabled:opacity-30">Continuar →</button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <h3 className="text-2xl font-bold mb-8">Contacto & Branding</h3>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">WhatsApp de Pedidos</label>
                                    <input type="tel" placeholder="57300..." value={formData.whatsapp_number} onChange={e => setFormData({...formData, whatsapp_number: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:border-amber-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Color de Marca</label>
                                    <input type="color" value={formData.brand_color} onChange={e => setFormData({...formData, brand_color: e.target.value})}
                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl p-1 cursor-pointer" />
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={handleBack} className="flex-1 py-5 bg-white/5 rounded-2xl font-bold">Atrás</button>
                                    <button onClick={handleNext} className="flex-[2] py-5 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl">Siguiente</button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <h3 className="text-2xl font-bold mb-8">Ingesta de Menú (IA)</h3>
                                <p className="text-white/40 text-xs mb-4">Sube una foto de tu carta física o digital. Nuestra IA la convertirá en un menú interactivo 4D al instante.</p>
                                <div className="border-2 border-dashed border-white/10 rounded-3xl p-10 text-center hover:border-amber-500/50 transition-colors relative">
                                    <input type="file" accept="image/*" onChange={e => setFormData({...formData, file: e.target.files[0]})} 
                                        className="absolute inset-0 opacity-0 cursor-pointer" />
                                    <div className="space-y-2">
                                        <span className="text-4xl">📸</span>
                                        <p className="text-[10px] font-bold uppercase tracking-widest">{formData.file ? formData.file.name : 'Subir Foto de Carta'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={handleBack} className="flex-1 py-5 bg-white/5 rounded-2xl font-bold">Atrás</button>
                                    <button onClick={handleSubmit} disabled={!formData.file || loading} 
                                        className="flex-[2] py-5 bg-amber-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg shadow-amber-500/20">
                                        {loading ? 'Activando...' : '✦ Finalizar Activación'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
