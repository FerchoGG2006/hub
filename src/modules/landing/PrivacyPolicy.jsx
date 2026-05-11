import React from 'react';
import { motion } from 'framer-motion';

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white/80 font-sans py-20 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-12"
      >
        <header className="space-y-4 border-b border-white/10 pb-10">
          <h1 className="text-4xl font-black tracking-tight text-white uppercase">Política de <span className="text-amber-500">Privacidad</span></h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/30">Última actualización: 29 de Abril, 2026</p>
        </header>

        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white uppercase tracking-widest border-l-2 border-amber-500 pl-4">1. Introducción</h2>
          <p className="leading-relaxed text-sm">
            Bienvenido a <strong>HUB management_app</strong>. Valoramos su privacidad y estamos comprometidos a proteger sus datos personales. 
            Esta política explica cómo recopilamos, usamos y protegemos su información cuando utiliza nuestra plataforma y nuestras integraciones con Meta (Facebook e Instagram).
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white uppercase tracking-widest border-l-2 border-amber-500 pl-4">2. Datos que Recopilamos</h2>
          <p className="leading-relaxed text-sm">
            Para el funcionamiento del "Instagram Autopilot", recopilamos los siguientes datos a través de la API de Meta:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-white/60">
            <li>Identificador de cuenta de Instagram Business.</li>
            <li>Tokens de acceso (almacenados de forma cifrada).</li>
            <li>Nombre de usuario y foto de perfil para visualización en el dashboard.</li>
            <li>Horarios de apertura y cierre configurados por usted.</li>
          </ul>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white uppercase tracking-widest border-l-2 border-amber-500 pl-4">3. Uso de los Datos</h2>
          <p className="leading-relaxed text-sm">
            Sus datos se utilizan exclusivamente para:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-white/60">
            <li>Sincronizar automáticamente su biografía de Instagram según sus horarios.</li>
            <li>Proporcionar analíticas de interacción con sus productos.</li>
            <li>Mejorar la gestión de su restaurante de forma automatizada.</li>
          </ul>
          <p className="text-sm font-bold text-amber-500/80 italic">No vendemos ni compartimos sus datos personales con terceros con fines publicitarios.</p>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white uppercase tracking-widest border-l-2 border-amber-500 pl-4">4. Eliminación de Datos</h2>
          <p className="leading-relaxed text-sm">
            Usted tiene el control total sobre sus datos. Puede solicitar la eliminación de su información vinculada de las siguientes maneras:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-white/60">
            <li>Desvinculando su cuenta de Instagram desde el panel de <strong>Configuración {'>'} Instagram Autopilot</strong>.</li>
            <li>Enviando un correo electrónico a <a href="mailto:fernandobaquero45@gmail.com" className="text-amber-500 hover:underline">fernandobaquero45@gmail.com</a> con el asunto "Eliminación de Datos".</li>
            <li>Eliminando la aplicación "management_app" desde su configuración de aplicaciones en Facebook.</li>
          </ul>
          <p className="leading-relaxed text-sm">
            Tras la solicitud, todos sus tokens y datos vinculados de Meta serán eliminados permanentemente de nuestra base de datos en un plazo de 24-48 horas.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white uppercase tracking-widest border-l-2 border-amber-500 pl-4">5. Seguridad</h2>
          <p className="leading-relaxed text-sm">
            Implementamos medidas de seguridad de nivel industrial, incluyendo cifrado SSL y almacenamiento seguro en bases de datos protegidas, para garantizar que su información esté a salvo de accesos no autorizados.
          </p>
        </section>

        <footer className="pt-10 border-t border-white/10 text-center">
          <p className="text-[10px] uppercase tracking-widest text-white/20">HUB SaaS Platform © 2026 - Todos los derechos reservados.</p>
        </footer>
      </motion.div>
    </div>
  );
};
