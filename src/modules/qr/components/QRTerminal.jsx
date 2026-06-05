import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Card, Heading, Button, Input, Badge } from '../../../shared/ui';

const getCenterBadge = (name) => {
  const display = name ? name.substring(0, 2).toUpperCase() : 'PL';
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <circle cx="50" cy="50" r="44" fill="#1A1208" stroke="#ffffff" stroke-width="6"/>
    <text x="50" y="62" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="36" fill="#ffffff" text-anchor="middle">${display}</text>
  </svg>`;
  const base64Svg = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64Svg}`;
};

export const QRTerminal = ({ config }) => {
  const enabledModules = config?.enabled_modules || ['orders', 'products'];
  const hasTables = enabledModules.includes('tables');
  const { tenantSlug } = useParams();
  
  const qrRef = useRef(null);
  const qrCodeOnlyRef = useRef(null);
  const batchQrRef = useRef(null);
  
  const [table, setTable] = useState('');
  const [tableCount, setTableCount] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [batchCurrent, setBatchCurrent] = useState(0);
  const [batchTable, setBatchTable] = useState('');

  const handleDownloadPNG = async () => {
    if (!qrCodeOnlyRef.current) return;
    const canvas = await html2canvas(qrCodeOnlyRef.current, { scale: 3, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `${tenantSlug}-qr${table ? '-mesa-'+table : ''}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadPDF = async () => {
    if (!qrCodeOnlyRef.current) return;
    setIsGenerating(true);
    const canvas = await html2canvas(qrCodeOnlyRef.current, { scale: 3, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const restName = (config?.name || 'PLATORIN').toUpperCase();
    const tableText = table ? (table.toLowerCase().startsWith("mesa") ? table.toUpperCase() : `MESA ${table.toUpperCase()}`) : 'CÓDIGO GENERAL';
    
    // 1. Fondo crema cálido
    pdf.setFillColor(251, 249, 246);
    pdf.rect(0, 0, 210, 297, 'F');
    
    // 2. Marco editorial doble elegante
    // Marco exterior dorado
    pdf.setDrawColor(200, 137, 26); // --gold
    pdf.setLineWidth(0.8);
    pdf.rect(8, 8, 194, 281);
    
    // Marco interior tinta
    pdf.setDrawColor(26, 18, 8); // --ink
    pdf.setLineWidth(0.3);
    pdf.rect(10, 10, 190, 277);
    
    // Adornos en las 4 esquinas del marco
    pdf.setFillColor(200, 137, 26);
    pdf.rect(9.5, 9.5, 1.5, 1.5, 'F');
    pdf.rect(199, 9.5, 1.5, 1.5, 'F');
    pdf.rect(9.5, 286, 1.5, 1.5, 'F');
    pdf.rect(199, 286, 1.5, 1.5, 'F');
    
    // 3. Encabezado editorial
    pdf.setTextColor(200, 137, 26); // --gold
    pdf.setFont('times', 'italic');
    pdf.setFontSize(12);
    pdf.text("ESCANEA • ORDENA • DISFRUTA", 105, 26, { align: "center" });
    
    // Línea divisoria sutil
    pdf.setDrawColor(200, 137, 26, 0.5);
    pdf.setLineWidth(0.2);
    pdf.line(75, 30, 135, 30);
    
    // Nombre del restaurante destacado en Times Bold Serif
    pdf.setTextColor(26, 18, 8); // --ink
    pdf.setFont('times', 'bold');
    pdf.setFontSize(28);
    pdf.text(restName, 105, 42, { align: "center" });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text("CARTA DIGITAL INTERACTIVA", 105, 49, { align: "center" });
    
    // 4. Tarjeta blanca central para el código QR con sombra simulada
    pdf.setFillColor(240, 235, 225); // sombra sutil beige
    pdf.roundedRect(51, 63, 110, 123, 6, 6, 'F');
    
    pdf.setFillColor(255, 255, 255); // tarjeta blanca principal
    pdf.roundedRect(50, 62, 110, 123, 6, 6, 'F');
    
    pdf.setDrawColor(26, 18, 8, 0.1);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(50, 62, 110, 123, 6, 6, 'D');
    
    // Insertar el QR Code limpio (centrado con menos padding)
    pdf.addImage(imgData, 'PNG', 55, 65, 100, 100);
    
    // Delgada línea divisoria dorada dentro de la tarjeta blanca (debajo del QR)
    pdf.setDrawColor(200, 137, 26, 0.3);
    pdf.setLineWidth(0.2);
    pdf.line(70, 171, 140, 171);
    
    // Identificador de mesa elegante dentro de la tarjeta blanca (ASCII seguro)
    pdf.setTextColor(26, 18, 8); // --ink
    pdf.setFont('times', 'bold');
    pdf.setFontSize(15);
    pdf.text(tableText, 105, 179, { align: "center" });
    
    // 5. Pasos de Instrucción (Ajustados en posición)
    pdf.setTextColor(26, 18, 8);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text("¿CÓMO FUNCIONA?", 105, 202, { align: "center" });
    
    // Columnas de pasos
    const stepY = 216;
    
    // Paso 1
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text("1. ESCANEA", 45, stepY, { align: "center" });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text("Abre la cámara de tu", 45, stepY + 4, { align: "center" });
    pdf.text("celular y enfoca el QR.", 45, stepY + 8, { align: "center" });
    
    // Paso 2
    pdf.setTextColor(26, 18, 8);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text("2. SELECCIONA", 105, stepY, { align: "center" });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text("Elige tus platos y bebidas", 105, stepY + 4, { align: "center" });
    pdf.text("favoritas del menú.", 105, stepY + 8, { align: "center" });
    
    // Paso 3
    pdf.setTextColor(26, 18, 8);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text("3. ORDENA", 165, stepY, { align: "center" });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text("Envía tu pedido directo a cocina", 165, stepY + 4, { align: "center" });
    pdf.text("y págalo de forma segura.", 165, stepY + 8, { align: "center" });
    
    // 6. Pie de página branding
    pdf.setDrawColor(200, 137, 26, 0.4);
    pdf.setLineWidth(0.2);
    pdf.line(85, 264, 125, 264);
    
    pdf.setTextColor(150, 150, 150);
    pdf.setFont('times', 'italic');
    pdf.setFontSize(10);
    pdf.text("Buen Provecho • Impulsado por Platorin", 105, 272, { align: "center" });
    
    pdf.save(`${tenantSlug}-qr-${table ? 'mesa-'+table : 'general'}.pdf`);
    setIsGenerating(false);
  };

  const handleGenerateBatch = async () => {
    const count = parseInt(tableCount);
    if (isNaN(count) || count <= 0) return;
    
    setIsGeneratingBatch(true);
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Configuración del Grid A4 (210mm x 297mm)
    const cardWidth = 85;  // mm
    const cardHeight = 60; // mm
    const startX = 15;    // Margen izquierdo
    const startY = 18;    // Margen superior
    const gapX = 10;       // Separación horizontal
    const gapY = 8;        // Separación vertical
    const maxCols = 2;
    const maxRows = 4;
    const itemsPerPage = maxCols * maxRows; // 8 elementos por página
    
    for (let i = 1; i <= count; i++) {
      setBatchCurrent(i);
      setBatchTable(i.toString());
      
      // Esperar a que React actualice el DOM de la tarjeta oculta
      await new Promise((resolve) => setTimeout(resolve, 120));
      
      if (!batchQrRef.current) continue;
      
      const canvas = await html2canvas(batchQrRef.current, { scale: 2.5, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      
      // Calcular índice dentro de la página actual (0 a 7)
      const indexOnPage = (i - 1) % itemsPerPage;
      
      // Si empezamos una nueva página y no es la primera, agregamos una página al PDF
      if (i > 1 && indexOnPage === 0) {
        pdf.addPage();
      }
      
      // Calcular fila y columna
      const col = indexOnPage % maxCols;
      const row = Math.floor(indexOnPage / maxCols);
      
      // Calcular coordenadas X e Y exactas en milímetros
      const x = startX + col * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);
      
      // Dibujar la tarjeta capturada
      pdf.addImage(imgData, 'PNG', x, y, cardWidth, cardHeight);
      
      // Dibujar una línea de corte muy sutil (gris claro punteado) alrededor de la tarjeta
      pdf.setDrawColor(210, 210, 210);
      pdf.setLineDashPattern([1, 1], 0);
      pdf.rect(x, y, cardWidth, cardHeight, 'D');
    }
    
    pdf.save(`${tenantSlug}-lote-mesas.pdf`);
    setIsGeneratingBatch(false);
    setBatchTable('');
    setBatchCurrent(0);
  };

  const menuUrl = table ? `${window.location.origin}/${tenantSlug}?mesa=${table}` : `${window.location.origin}/${tenantSlug}`;

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
              disabled={isGenerating || isGeneratingBatch}
            />
            
            <div className="flex gap-4">
              <Button variant="secondary" onClick={handleDownloadPNG} disabled={isGenerating || isGeneratingBatch} className="flex-1 py-4 text-[10px] uppercase font-bold">
                Descargar PNG
              </Button>
              <Button onClick={handleDownloadPDF} isLoading={isGenerating} disabled={isGenerating || isGeneratingBatch} className="flex-1 py-4 text-[10px] uppercase font-bold">
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
                   disabled={isGenerating || isGeneratingBatch}
                   className="w-20 !bg-white/10 !border-white/10 !text-white text-center"
                 />
                 <Button 
                   variant="accent" 
                   onClick={handleGenerateBatch}
                   isLoading={isGeneratingBatch}
                   disabled={isGenerating || isGeneratingBatch || !tableCount}
                   className="flex-1 py-3 text-[10px] font-bold"
                 >
                   {isGeneratingBatch ? `CREANDO (${batchCurrent}/${tableCount})...` : 'CREAR LOTE'}
                 </Button>
               </div>
            </Card>
          )}
        </div>

        <div className="flex flex-col items-center">
          <div ref={qrRef} className="bg-white p-12 pb-14 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-[var(--border-soft)] relative flex flex-col items-center justify-center">
            
            {/* Contenedor relativo exacto del código QR - Capturado limpiamente para descargas */}
            <div ref={qrCodeOnlyRef} className="bg-white p-4 rounded-3xl">
              <QRCodeSVG 
                value={menuUrl} 
                size={240}
                bgColor={"#ffffff"}
                fgColor={"#1A1208"}
                level={"Q"}
                imageSettings={{ 
                  src: config?.logo_url || getCenterBadge(config?.name || 'Platorin'), 
                  height: 52, 
                  width: 52, 
                  excavate: true 
                }}
              />
            </div>
            
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[var(--text-primary)] text-white px-10 py-3 rounded-full text-[11px] font-black tracking-[0.4em] uppercase shadow-[0_15px_40px_rgba(0,0,0,0.3)] z-20">
              Escanea
            </div>
          </div>
          <p className="mt-12 text-[var(--text-muted)] text-[10px] uppercase tracking-widest font-black text-center max-w-[200px]">
            Este es tu código {table ? `para la ${table}` : 'general'}.
          </p>
        </div>
      </div>

      {/* Elemento oculto optimizado para impresión de lote (Tarjeta horizontal de 85x60mm) */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={batchQrRef} className="bg-white relative flex items-center p-6 gap-6" style={{ width: '425px', height: '300px', boxSizing: 'border-box' }}>
          {/* Lado Izquierdo: Código QR */}
          <div className="relative flex-shrink-0">
            <QRCodeSVG 
              value={`${window.location.origin}/${tenantSlug}?mesa=${batchTable}`} 
              size={140}
              bgColor={"#ffffff"}
              fgColor={"#1A1208"}
              level={"Q"}
              imageSettings={{ 
                src: config?.logo_url || getCenterBadge(config?.name || 'Platorin'), 
                height: 36, 
                width: 36, 
                excavate: true 
              }}
            />
          </div>

          {/* Lado Derecho: Información de Marca e Instrucciones */}
          <div className="flex flex-col justify-between h-full py-2 flex-grow" style={{ fontFamily: "system-ui, sans-serif" }}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C8891A] mb-1">{config?.name || 'Restaurante'}</p>
              <h3 className="text-2xl font-[var(--font-serif)] font-black text-[#1A1208] italic">Mesa {batchTable}</h3>
            </div>
            <div>
              <p className="text-[9px] font-bold text-[#1A1208]/60 uppercase tracking-widest mb-1">Escanea el QR</p>
              <p className="text-[8px] text-[var(--text-muted)] font-medium leading-normal">Para ver el menú digital, ordenar y pagar desde tu celular.</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
