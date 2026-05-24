import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import PhoneInputModule from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const PhoneInput = PhoneInputModule.default || PhoneInputModule;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const RegisterBusiness = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        brand_color: '#C8891A',
        whatsapp_number: '',
        email: '',
        file: null
    });

    const generateSlug = (text) => {
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^a-z0-9\s-]/g, "")    // Remove special chars
            .trim()
            .replace(/\s+/g, "-")           // Replace spaces with -
            .replace(/-+/g, "-");           // Remove consecutive -
    };

    const handleNameChange = (e) => {
        const name = e.target.value;
        setFormData(prev => ({ ...prev, name }));
    };

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const data = new FormData();
            const finalSlug = formData.slug || generateSlug(formData.name);
            data.append('name', formData.name);
            data.append('slug', finalSlug);
            data.append('brand_color', formData.brand_color);
            data.append('whatsapp_number', formData.whatsapp_number);
            data.append('email', formData.email);
            if (formData.file) {
                data.append('file', formData.file);
            }

            const token = localStorage.getItem('hub_token');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch(`${API_URL}/api/admin/onboard`, {
                method: 'POST',
                body: data,
                headers: headers
            });

            const json = await res.json();
            
            if (!res.ok) {
                throw new Error(json.message || json.detail || "Error en activación");
            }

            console.log("Onboarding success:", json);
            setResult(json.data || json);
            setStep(4);
        } catch (err) {
            console.error("Onboarding error:", err);
            alert("Error: " + (err.name === 'TypeError' && err.message === 'Load failed' 
                ? "No se pudo conectar con el servidor. Verifica tu conexión o configuración de API." 
                : err.message));
        } finally {
            setLoading(false);
        }
    };

    const placeholderSlug = generateSlug(formData.name) || 'tu-negocio';

    if (step === 4 && result) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center p-6">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="surface-editorial max-w-xl w-full text-center py-16 px-12 shadow-2xl">
                    <div className="w-20 h-20 bg-green-light rounded-full flex items-center justify-center mx-auto mb-8">
                        <span className="text-4xl">✨</span>
                    </div>
                    <h2 className="heading-editorial text-4xl serif-italic">¡Bienvenido a Platorin!</h2>
                    <p className="text-sub mt-4 mb-10">Tu entorno digital ha sido creado y tu menú procesado con éxito.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-10">
                        <div className="bg-cream-deep/30 p-5 rounded-2xl border border-border">
                            <p className="text-[10px] uppercase tracking-widest text-ink-30 mb-2 font-bold">Usuario</p>
                            <p className="text-sm font-bold text-ink break-all">{result.credentials?.user || 'N/A'}</p>
                        </div>
                        <div 
                            className="bg-cream-deep/30 p-5 rounded-2xl border border-gold/30 cursor-pointer hover:bg-gold/5 transition-all group relative"
                            onClick={() => {
                                navigator.clipboard.writeText(result.credentials?.passcode);
                                alert("Passcode copiado al portapapeles");
                            }}
                        >
                            <p className="text-[10px] uppercase tracking-widest text-ink-30 mb-2 font-bold">Passcode (Toca para copiar)</p>
                            <p className="text-2xl font-bold text-gold tracking-widest font-mono">{result.credentials?.passcode || '------'}</p>
                            <span className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">📋</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Link to={`/admin/${formData.slug || placeholderSlug}`} className="btn-editorial w-full py-5 justify-center text-sm uppercase tracking-widest">
                            Entrar a mi Panel Admin
                        </Link>
                        <p className="text-[10px] uppercase tracking-widest text-ink-30 font-bold">
                            ⚠️ Por seguridad, toma una captura de pantalla de esta ficha.
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream text-ink flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative background items */}
            <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full blur-[120px] bg-gold/5" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full blur-[120px] bg-green/5" />

            <div className="w-full max-w-lg relative z-10">
                <div className="mb-12 text-center">
                    <h1 className="logo text-5xl mb-2">Plato<b>rin</b></h1>
                    <p className="tag-editorial">Registro de Negocio</p>
                </div>

                <div className="surface-editorial shadow-2xl relative overflow-hidden p-10 lg:p-12">
                    <div className="absolute top-0 left-0 w-full h-1 bg-cream-deep">
                        <motion.div className="h-full bg-gold" animate={{ width: `${(step/3)*100}%` }} />
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="s1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                                <h3 className="heading-editorial text-2xl serif-italic">Identidad Digital</h3>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-ink-50 font-bold">Nombre del Negocio</label>
                                        <input type="text" placeholder="Ej: El Fogón Dorado" value={formData.name} onChange={handleNameChange}
                                            className="w-full bg-cream-deep/20 border border-border rounded-xl py-4 px-6 focus:border-gold outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-ink-50 font-bold">URL del Menú (Slug)</label>
                                        <div className="space-y-2">
                                            <input 
                                                type="text" 
                                                placeholder={placeholderSlug} 
                                                value={formData.slug} 
                                                onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/\s+/g, '-')})}
                                                className="w-full bg-cream-deep/20 border border-border rounded-xl py-4 px-6 focus:border-gold outline-none transition-all font-mono text-sm" 
                                            />
                                            <p className="text-[11px] text-ink-30 font-mono pl-2">
                                                Tu link será: <span className="text-gold font-bold">platorin.com/{formData.slug || placeholderSlug}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={handleNext} disabled={!formData.name} className="btn-editorial w-full py-5 justify-center mt-4 uppercase tracking-widest disabled:opacity-20">
                                    Siguiente Paso →
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                                <h3 className="heading-editorial text-2xl serif-italic">Contacto & Estilo</h3>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-ink-50 font-bold">WhatsApp de Pedidos</label>
                                        <PhoneInput 
                                            country={'co'}
                                            value={formData.whatsapp_number} 
                                            onChange={val => setFormData({...formData, whatsapp_number: val})}
                                            containerClass="!w-full"
                                            inputClass="!w-full !h-14 !bg-cream-deep/20 !border-border !rounded-xl !pl-14 !focus:border-gold !transition-all !font-mono !text-sm !text-ink"
                                            buttonClass="!bg-transparent !border-none !rounded-l-xl !hover:bg-cream-deep/30"
                                            dropdownClass="!bg-cream !border-border !rounded-xl !shadow-2xl !text-ink !font-sans"
                                            placeholder="Ej: 300 123 4567"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-ink-50 font-bold">Color Principal de la Carta</label>
                                        <div className="flex items-center gap-8">
                                            <div className="relative w-20 h-20 flex items-center justify-center">
                                                {/* Contenedor circular gris */}
                                                <div className="absolute inset-0 bg-cream-deep/30 rounded-full border border-border shadow-sm" />
                                                
                                                {/* Círculo de color interior premium */}
                                                <div className="relative w-[72px] h-[72px] rounded-full border-2 border-white shadow-md overflow-hidden transition-transform hover:scale-105 active:scale-95">
                                                    <input type="color" value={formData.brand_color} onChange={e => setFormData({...formData, brand_color: e.target.value})}
                                                        className="absolute inset-0 w-[200%] h-[200%] -top-[50%] -left-[50%] cursor-pointer border-none p-0 outline-none" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-ink-50 mb-1">Identidad Visual</p>
                                                <p className="text-[11px] text-ink-30 leading-relaxed">Este color definirá el acento de tus platos y botones en el menú digital.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={handleBack} className="btn-editorial-outline py-4 px-8 font-bold">Atrás</button>
                                    <button onClick={handleNext} className="btn-editorial flex-1 py-4 justify-center uppercase tracking-widest">Siguiente →</button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="s3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                                <h3 className="heading-editorial text-2xl serif-italic">Ingesta de Menú (IA)</h3>
                                <p className="text-sub text-sm">Sube una foto de tu carta actual. Nuestra IA la analizará para crear tu menú digital instantáneamente.</p>
                                
                                <div className="border-2 border-dashed border-border rounded-[2rem] p-12 text-center hover:border-gold transition-colors relative bg-cream-deep/10 group">
                                    <input type="file" accept="image/*" onChange={e => setFormData({...formData, file: e.target.files[0]})} 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                                    <div className="space-y-4">
                                        <span className="text-5xl block group-hover:scale-110 transition-transform">📸</span>
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-ink-50">
                                            {formData.file ? formData.file.name : 'Haz clic o arrastra tu foto aquí'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-4 pt-4">
                                    <button onClick={handleBack} className="btn-editorial-outline py-4 px-8 font-bold">Atrás</button>
                                    <button onClick={handleSubmit} disabled={loading} 
                                        className="btn-editorial flex-1 py-4 justify-center uppercase tracking-[0.2em]">
                                        {loading ? 'Activando...' : 'Finalizar Registro'}
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
