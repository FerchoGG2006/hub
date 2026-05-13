import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const SuperReset = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTenant, setSelectedTenant] = useState('');
    const [newPass, setNewPass] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        // En un entorno real, esto requeriría token de SuperAdmin. 
        // Como es herramienta de emergencia para el fundador, usaremos un bypass temporal.
        fetch(`${API_URL}/api/v1/tenant/all-debug`)
            .then(res => res.json())
            .then(json => {
                setTenants(json.data || []);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    const handleReset = async () => {
        if (!selectedTenant || !newPass) return;
        setStatus('Procesando...');
        
        const formData = new URLSearchParams();
        formData.append('tenant_slug', selectedTenant);
        formData.append('new_passcode', newPass);

        try {
            const res = await fetch(`${API_URL}/api/admin/reset-passcode-emergency`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            setStatus(data.message || 'Éxito');
        } catch (err) {
            setStatus('Error: ' + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-ink text-cream p-12">
            <h1 className="heading-editorial text-4xl mb-8">Recuperación de Emergencia (Fundador)</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="surface-editorial p-8 bg-white/5 border-white/10">
                    <h2 className="text-xl mb-4 font-bold">Tus Restaurantes Creados</h2>
                    {loading ? <p>Cargando lista...</p> : (
                        <div className="space-y-3">
                            {tenants.map(t => (
                                <div key={t.slug} onClick={() => setSelectedTenant(t.slug)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedTenant === t.slug ? 'border-gold bg-gold/10' : 'border-white/10 hover:bg-white/5'}`}>
                                    <p className="font-bold">{t.name}</p>
                                    <p className="text-xs opacity-50">slug: {t.slug}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="surface-editorial p-8 bg-white/5 border-white/10">
                    <h2 className="text-xl mb-4 font-bold">Resetear Passcode</h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest mb-2">Restaurante Seleccionado</label>
                            <input type="text" readOnly value={selectedTenant} className="w-full bg-transparent border-b border-white/20 py-2 outline-none text-gold font-bold" />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest mb-2">Nuevo Passcode (6 dígitos)</label>
                            <input type="text" maxLength="6" value={newPass} onChange={e => setNewPass(e.target.value)} 
                                placeholder="Ej: 123456" className="w-full bg-white/10 rounded-lg p-4 outline-none focus:ring-1 ring-gold" />
                        </div>
                        <button onClick={handleReset} className="btn-editorial w-full py-4 justify-center uppercase tracking-widest bg-gold text-ink">
                            Actualizar Passcode
                        </button>
                        {status && <p className="text-center font-mono text-sm bg-gold/20 p-4 rounded-lg">{status}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
