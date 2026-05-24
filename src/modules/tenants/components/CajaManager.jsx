import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Heading, Badge, Button, EmptyState, Modal } from '../../../shared/ui';
import { useProducts } from '../../menus/useProducts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PAYMENT_ICONS = {
  efectivo: '💵', nequi: '📲', wompi: '💳', 
  transferencia: '🏦', pse: '🏦', otro: '💰'
};

const TableCard = ({ mesa, onInitiateClose, onInitiateAdd, isClosing }) => {
  const [expanded, setExpanded] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const allItems = mesa.orders.flatMap(o => o.items || []);

  useEffect(() => {
    if (!mesa.oldest_order) return;
    const updateElapsed = () => {
      setElapsed(Math.floor((Date.now() - new Date(mesa.oldest_order).getTime()) / 60000));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 60000);
    return () => clearInterval(interval);
  }, [mesa.oldest_order]);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[var(--surface-primary)] border border-[var(--border-soft)] rounded-[2rem] overflow-hidden shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-all"
    >
      {/* Header de Mesa */}
      <div 
        className="p-6 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 rounded-2xl flex items-center justify-center">
              <span className="text-lg font-black text-[var(--brand-primary)]">{mesa.table_number}</span>
            </div>
            <div>
              <Heading level={4} className="!text-sm">Mesa {mesa.table_number}</Heading>
              <span className="text-[9px] text-[var(--text-disabled)] font-bold uppercase tracking-widest">
                {mesa.orders.length} pedido{mesa.orders.length > 1 ? 's' : ''} · {elapsed} min
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-[var(--font-serif)] italic text-2xl font-bold text-[var(--text-primary)]">
              ${mesa.total.toLocaleString()}
            </p>
            <Badge variant={mesa.all_completed ? 'success' : 'pending'}>
              {mesa.all_completed ? 'Lista para cobrar' : 'En proceso'}
            </Badge>
          </div>
        </div>

        {/* Items resumen */}
        <div className="flex flex-wrap gap-1.5">
          {allItems.slice(0, 6).map((item, i) => (
            <span key={i} className="text-[10px] bg-[var(--bg-secondary)] px-2.5 py-1 rounded-full text-[var(--text-muted)] font-medium">
              {item.quantity || item.qty || 1}× {item.name}
            </span>
          ))}
          {allItems.length > 6 && (
            <span className="text-[10px] bg-[var(--bg-tertiary)] px-2.5 py-1 rounded-full text-[var(--text-disabled)] font-bold">
              +{allItems.length - 6} más
            </span>
          )}
        </div>
      </div>

      {/* Detalle expandido */}
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-[var(--border-soft)] pt-4 space-y-4">
              {mesa.orders.map(order => (
                <div key={order.id} className="bg-[var(--bg-secondary)]/50 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-[var(--text-disabled)] tracking-widest uppercase">
                      Orden #{order.id} · {order.customer_name || 'Mesa'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{PAYMENT_ICONS[order.payment_method] || '💰'}</span>
                      <Badge variant={order.status === 'completed' ? 'success' : 'pending'} className="!text-[8px]">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                  {(order.items || []).map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-[var(--text-muted)]">{item.quantity || item.qty || 1}× {item.name}</span>
                      <span className="font-semibold">${((item.price || 0) * (item.quantity || item.qty || 1)).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-end pt-1 border-t border-dashed border-[var(--border-soft)]">
                    <span className="font-[var(--font-serif)] italic font-bold">${(order.total_price || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onInitiateAdd(mesa.table_number); }}
                  variant="secondary"
                  className="py-4 text-[10px] font-black uppercase tracking-[0.1em] !rounded-xl"
                >
                  + Añadir
                </Button>
                {/* Botón cobrar */}
                <Button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onInitiateClose(mesa); }}
                  disabled={isClosing}
                  className="py-4 text-[10px] font-black uppercase tracking-[0.1em] !rounded-xl"
                  style={{ backgroundColor: mesa.all_completed ? 'var(--brand-primary)' : 'var(--brand-accent)', color: '#fff' }}
                >
                  {isClosing ? '...' : `Cobrar $${mesa.total.toLocaleString()}`}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const CajaManager = () => {
  const { tenantSlug } = useParams();
  const [mesas, setMesas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [mesaToClose, setMesaToClose] = useState(null);
  const [tableToAdd, setTableToAdd] = useState(null);
  const [closingTables, setClosingTables] = useState({});
  const { products, fetchProducts } = useProducts(tenantSlug);
  
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const fetchMesas = useCallback(async () => {
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/caja/mesas-abiertas`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        const json = await res.json();
        setMesas(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching mesas:', err);
    }
  }, []);

  const fetchResumen = useCallback(async () => {
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/caja/resumen`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        const json = await res.json();
        setResumen(json.data || {});
      }
    } catch (err) {
      console.error('Error fetching resumen:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchMesas(), fetchResumen(), fetchProducts()]);
    };
    init();
    const interval = setInterval(() => { fetchMesas(); fetchResumen(); }, 15000);
    return () => clearInterval(interval);
  }, [fetchMesas, fetchResumen, fetchProducts]);

  const handleCloseMesa = async (tableNumber) => {
    setClosingTables(prev => ({ ...prev, [tableNumber]: true }));
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/caja/cerrar-mesa/${tableNumber}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        fetchMesas();
        fetchResumen();
      } else {
        const json = await res.json();
        alert(json.message || 'Error cerrando mesa');
      }
    } catch {
      alert('Error de conexión');
    }
    setClosingTables(prev => ({ ...prev, [tableNumber]: false }));
  };

  const confirmAndClose = async () => {
    if (!mesaToClose) return;
    const num = mesaToClose.table_number;
    setMesaToClose(null);
    await handleCloseMesa(num);
  };

  const handleAddProduct = async () => {
    if (!tableToAdd || !selectedProduct || quantity < 1) return;
    
    const prodObj = products.find(p => p.id.toString() === selectedProduct);
    if (!prodObj) return;

    const parsePrice = (priceStr) => {
      if (typeof priceStr === 'number') return priceStr;
      const numericString = String(priceStr).replace(/[^\d]/g, '');
      return parseInt(numericString, 10) || 0;
    };
    const unitPrice = parsePrice(prodObj.price);

    setIsAdding(true);
    try {
      const token = localStorage.getItem('hub_token');
      const items = [{
        id: prodObj.id,
        name: prodObj.name,
        price: unitPrice,
        qty: quantity
      }];
      
      const res = await fetch(`${API_URL}/api/admin/caja/mesas-abiertas/${tableToAdd}/add-order`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items_json: JSON.stringify(items),
          total_price: unitPrice * quantity
        })
      });

      if (res.ok) {
        setTableToAdd(null);
        setSelectedProduct("");
        setQuantity(1);
        fetchMesas();
        fetchResumen();
      } else {
        const json = await res.json();
        alert(json.message || 'Error al agregar producto');
      }
    } catch {
      alert('Error de conexión');
    }
    setIsAdding(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--border-soft)] pb-10">
        <div>
          <Badge variant="brand" className="mb-2">Gestión contable</Badge>
          <Heading level={2}>
            <span className="font-[var(--font-serif)] italic">Caja</span> del Día
          </Heading>
          <p className="text-[var(--text-muted)] text-sm mt-1">Comandas abiertas, cobros y resumen de ventas.</p>
        </div>
      </header>

      {/* Resumen Cards */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="!p-5 text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-disabled)] mb-1">Ventas Hoy</p>
            <p className="font-[var(--font-serif)] italic text-2xl font-bold text-[var(--brand-primary)]">
              ${(resumen.total_ventas || 0).toLocaleString()}
            </p>
          </Card>
          <Card className="!p-5 text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-disabled)] mb-1">Ticket Promedio</p>
            <p className="font-[var(--font-serif)] italic text-2xl font-bold">
              ${(resumen.ticket_promedio || 0).toLocaleString()}
            </p>
          </Card>
          <Card className="!p-5 text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-disabled)] mb-1">Cerrados</p>
            <p className="font-[var(--font-serif)] italic text-2xl font-bold text-green-600">{resumen.pedidos_cerrados || 0}</p>
          </Card>
          <Card className="!p-5 text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-disabled)] mb-1">Mesas Abiertas</p>
            <p className="font-[var(--font-serif)] italic text-2xl font-bold text-[var(--brand-accent)]">{mesas.length}</p>
          </Card>
        </div>
      )}

      {/* Desglose por método de pago */}
      {resumen?.metodos_pago && Object.keys(resumen.metodos_pago).length > 0 && (
        <Card className="!p-6">
          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-disabled)] mb-4">Desglose por Método</p>
          <div className="flex flex-wrap gap-4">
            {Object.entries(resumen.metodos_pago).map(([method, data]) => (
              <div key={method} className="flex items-center gap-3 bg-[var(--bg-secondary)] rounded-2xl px-4 py-3">
                <span className="text-lg">{PAYMENT_ICONS[method] || '💰'}</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{method}</p>
                  <p className="font-[var(--font-serif)] italic font-bold">${(data.total || 0).toLocaleString()}</p>
                </div>
                <Badge variant="brand" className="!text-[8px]">{data.count}x</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Mesas abiertas */}
      <div>
        <Heading level={3} className="!text-sm uppercase tracking-widest mb-4 text-[var(--text-disabled)]">
          🍽️ Mesas Abiertas ({mesas.length})
        </Heading>
        
        {mesas.length === 0 ? (
          <EmptyState
            icon="✅"
            title="Todas las mesas cerradas"
            description="No hay comandas pendientes de cobro. ¡Gran día!"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <AnimatePresence>
              {mesas.map(mesa => (
                <TableCard 
                  key={mesa.table_number} 
                  mesa={mesa} 
                  onInitiateClose={setMesaToClose} 
                  onInitiateAdd={setTableToAdd}
                  isClosing={closingTables[mesa.table_number]}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Cierre */}
      <Modal 
        isOpen={!!mesaToClose} 
        onClose={() => setMesaToClose(null)}
        title={mesaToClose ? `Cerrar Mesa ${mesaToClose.table_number}` : ''}
      >
        {mesaToClose && (
          <div>
            <p className="text-[var(--text-muted)] text-sm mb-6">
              ¿Estás seguro de cerrar esta mesa y marcar sus pedidos como cobrados? <br/><br/>
              El total a cobrar es de <span className="font-bold text-[var(--brand-primary)] text-lg">${mesaToClose.total.toLocaleString()} COP</span>.
            </p>
            <div className="flex gap-4 mt-8">
              <Button variant="secondary" className="flex-1" onClick={() => setMesaToClose(null)}>
                Cancelar
              </Button>
              <Button className="flex-1 bg-[var(--brand-primary)] text-white" onClick={confirmAndClose}>
                Sí, Cobrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal para Añadir Producto */}
      <Modal
        isOpen={!!tableToAdd}
        onClose={() => setTableToAdd(null)}
        title={tableToAdd ? `Añadir a Mesa ${tableToAdd}` : ''}
      >
        {tableToAdd && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Producto</label>
              <select 
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-soft)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand-primary)]"
                value={selectedProduct}
                onChange={e => setSelectedProduct(e.target.value)}
              >
                <option value="">Selecciona un producto</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.emoji} {p.name} - ${p.price.toLocaleString()}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Cantidad</label>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center font-bold text-[var(--text-primary)] hover:bg-[var(--border-soft)] transition-colors"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-lg">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center font-bold text-[var(--text-primary)] hover:bg-[var(--border-soft)] transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-4 mt-8 pt-4 border-t border-[var(--border-soft)]">
              <Button variant="secondary" className="flex-1" onClick={() => setTableToAdd(null)}>
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-[var(--brand-primary)] text-white" 
                onClick={handleAddProduct}
                disabled={!selectedProduct || isAdding}
              >
                {isAdding ? 'Añadiendo...' : 'Añadir'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};
