import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Card, Heading, Button, Input, Badge } from '../../../shared/ui';

export const QRTerminal = ({ config }) => {
  const enabledModules = config?.enabled_modules || ['orders', 'products'];
  const hasTables = enabledModules.includes('tables');
  const { tenantSlug } = useParams();
  const qrRef = useRef(null);
  const [table, setTable] = useState('');
  const [tableCount, setTableCount] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPNG = async () => {
    if (!qrRef.current) return;
    const canvas = await html2canvas(qrRef.current, { backgroundColor: null });
    const link = document.createElement('a');
    link.download = `${tenantSlug}-qr${table ? '-mesa-'+table : ''}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadPDF = async () => {
    if (!qrRef.current) return;
    setIsGenerating(true);
    const canvas = await html2canvas(qrRef.current, { scale: 3, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    pdf.setFillColor(245, 240, 232); // --cream
    pdf.rect(0, 0, 210, 297, 'F');
    pdf.setTextColor(26, 18, 8); // --ink
    pdf.setFontSize(32);
    pdf.setFont('helvetica', 'bold');
    if (table) pdf.text(`MESA ${table}`, 105, 35, { align: "center" });
    pdf.setTextColor(200, 137, 26); // --gold
    pdf.text("Menú Digital Platorin", 105, 50, { align: "center" });
    pdf.addImage(imgData, 'PNG', 55, 90, 100, 100);
    pdf.save(`${tenantSlug}-qr${table ? '-mesa-'+table : ''}.pdf`);
    setIsGenerating(false);
  };

  const menuUrl = table ? `${window.location.origin}/t/${tenantSlug}?mesa=${table}` : `${window.location.origin}/t/${tenantSlug}`;
  
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto py-0 flex flex-col items-center gap-8">
      <div className="text-center">
        <Badge variant="brand" className="mb-4">Conexión con el cliente</Badge>
        <Heading level={2}>Generador de <span className="font-[var(--font-serif)] italic">Códigos QR</span></Heading>
        <p className="text-[var(--text-muted)] mt-2 text-sm font-medium">Descarga tus códigos para imprimir y colocar en las mesas.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start w-full">
        <div className="space-y-8">
          <Card className="space-y-6 !rounded-[2rem]">
            <Input 
              label="Identificador de Mesa (Opcional)"
              placeholder="Ej: Mesa 1, Terraza..." 
              value={table}
              onChange={(e) => setTable(e.target.value)}
            />
            
            <div className="flex gap-4">
              <Button variant="secondary" onClick={handleDownloadPNG} className="flex-1 py-4 text-[10px] uppercase font-bold">
                Descargar PNG
              </Button>
              <Button onClick={handleDownloadPDF} isLoading={isGenerating} className="flex-1 py-4 text-[10px] uppercase font-bold">
                PDF para Imprimir
              </Button>
            </div>
          </Card>

          {hasTables && (
            <Card className="!bg-[var(--text-primary)] text-white space-y-4 !rounded-[2rem]">
               <Heading level={4} className="!text-white">Descarga Masiva</Heading>
               <p className="text-white/40 text-xs font-medium">Genera hasta 100 códigos de una sola vez para tu restaurante.</p>
               <div className="flex gap-3">
                 <Input 
                   type="number" 
                   placeholder="Cant." 
                   value={tableCount}
                   onChange={(e) => setTableCount(e.target.value)}
                   className="w-20 !bg-white/10 !border-white/10 !text-white text-center"
                 />
                 <Button variant="accent" className="flex-1 py-3 text-[10px] font-bold">
                   CREAR LOTE
                 </Button>
               </div>
            </Card>
          )}
        </div>

        <div className="flex flex-col items-center">
          <div ref={qrRef} className="bg-white p-10 rounded-[3rem] shadow-2xl border border-[var(--border-soft)] relative">
            <QRCodeSVG 
              value={menuUrl} 
              size={240}
              bgColor={"#ffffff"}
              fgColor={"#1A1208"}
              level={"Q"}
              imageSettings={{ src: "/logo.png", height: 50, width: 50, excavate: true }}
            />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[var(--text-primary)] text-white px-10 py-3 rounded-full text-[11px] font-black tracking-[0.4em] uppercase shadow-[0_15px_40px_rgba(0,0,0,0.3)] z-20">
              Escanea
            </div>
          </div>
          <p className="mt-12 text-[var(--text-muted)] text-[10px] uppercase tracking-widest font-black text-center max-w-[200px]">
            Este es tu código {table ? `para la ${table}` : 'general'}.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
