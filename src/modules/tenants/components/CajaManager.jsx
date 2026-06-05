import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

  // ═══════════════ NEW SHIFT SESSION STATE ═══════════════
  const [currentSession, setCurrentSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [history, setHistory] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState("session"); // "session", "history"
  
  const [baseAmount, setBaseAmount] = useState(100000);
  const [openNotes, setOpenNotes] = useState("");
  const [isOpening, setIsOpening] = useState(false);
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [isRegisteringExpense, setIsRegisteringExpense] = useState(false);
  
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [realCash, setRealCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [isClosingSession, setIsClosingSession] = useState(false);

  const fetchCurrentSession = useCallback(async () => {
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/caja/session/current`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        const json = await res.json();
        setCurrentSession(json.data || null);
      }
    } catch (err) {
      console.error('Error fetching current session:', err);
    } finally {
      setLoadingSession(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/caja/session/history`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        const json = await res.json();
        setHistory(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  }, []);

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
      await Promise.all([fetchCurrentSession(), fetchHistory(), fetchMesas(), fetchResumen(), fetchProducts()]);
    };
    init();
    const interval = setInterval(() => { 
      fetchCurrentSession();
      fetchMesas(); 
      fetchResumen(); 
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchCurrentSession, fetchHistory, fetchMesas, fetchResumen, fetchProducts]);

  const handleOpenSession = async () => {
    if (!baseAmount || baseAmount < 0) {
      alert("Por favor ingresa una base en efectivo válida.");
      return;
    }
    setIsOpening(true);
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/caja/session/open`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ base_amount: parseInt(baseAmount), notes: openNotes })
      });
      if (res.ok) {
        setOpenNotes("");
        await fetchCurrentSession();
      } else {
        const json = await res.json();
        alert(json.message || "Error al abrir la caja.");
      }
    } catch (err) {
      alert("Error de conexión con el servidor.");
    } finally {
      setIsOpening(false);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseAmount || expenseAmount <= 0 || !expenseDesc) {
      alert("Por favor ingresa un monto válido y una descripción del egreso.");
      return;
    }
    setIsRegisteringExpense(true);
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/caja/session/expense`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: parseInt(expenseAmount), description: expenseDesc })
      });
      if (res.ok) {
        setShowExpenseModal(false);
        setExpenseAmount("");
        setExpenseDesc("");
        await fetchCurrentSession();
      } else {
        const json = await res.json();
        alert(json.message || "Error al registrar el egreso.");
      }
    } catch (err) {
      alert("Error de conexión con el servidor.");
    } finally {
      setIsRegisteringExpense(false);
    }
  };

  const handleCloseSession = async () => {
    if (realCash === "" || realCash < 0) {
      alert("Por favor ingresa el monto real de efectivo contado en el arqueo.");
      return;
    }
    setIsClosingSession(true);
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/caja/session/close`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ real_cash: parseInt(realCash), notes: closeNotes })
      });
      if (res.ok) {
        setShowCloseModal(false);
        setRealCash("");
        setCloseNotes("");
        await fetchCurrentSession();
        await fetchHistory();
      } else {
        const json = await res.json();
        alert(json.message || "Error al cerrar la caja.");
      }
    } catch (err) {
      alert("Error de conexión con el servidor.");
    } finally {
      setIsClosingSession(false);
    }
  };

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
        fetchCurrentSession();
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
        fetchCurrentSession();
      } else {
        const json = await res.json();
        alert(json.message || 'Error al agregar producto');
      }
    } catch {
      alert('Error de conexión');
    }
    setIsAdding(false);
  };

  // Cálculos dinámicos de arqueo en el modal
  const liveDiscrepancy = useMemo(() => {
    if (!currentSession || realCash === "") return 0;
    return parseInt(realCash) - currentSession.expected_cash;
  }, [currentSession, realCash]);

  // ═══════════════ RENDER BLOCK: LOADING ═══════════════
  if (loadingSession) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[var(--surface-primary)] rounded-[2.5rem] border border-[var(--border-soft)]">
        <div className="w-10 h-10 border-t-2 border-[var(--brand-primary)] rounded-full animate-spin mb-4" />
        <p className="text-[10px] text-[var(--text-disabled)] uppercase tracking-[0.2em] font-black">Cargando control de caja...</p>
      </div>
    );
  }

  // ═══════════════ RENDER BLOCK: CLOSE SESSION / APERTURA ═══════════════
  if (!currentSession) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto py-12">
        <Card className="!p-8 shadow-xl border border-[var(--border-soft)] rounded-[2.5rem]">
          <div className="text-center mb-6">
            <span className="text-4xl block mb-3">🔑</span>
            <Badge variant="brand" className="mb-2">Turno Cerrado</Badge>
            <Heading level={2} className="!text-xl font-bold">Apertura de Caja</Heading>
            <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
              Para registrar comisiones, comandas y ventas, debes abrir una sesión de caja declarando la base en efectivo del día.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Base en Efectivo (COP)</label>
              <input 
                type="number" 
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-soft)] rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[var(--brand-primary)] font-bold text-lg text-[var(--brand-primary)]"
                placeholder="100000"
                value={baseAmount}
                onChange={e => setBaseAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Notas / Observaciones</label>
              <textarea 
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-soft)] rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[var(--brand-primary)] min-h-[60px]"
                placeholder="Ej. Sencilla de $100k, turno de la noche."
                value={openNotes}
                onChange={e => setOpenNotes(e.target.value)}
              />
            </div>

            <Button 
              className="w-full py-4 bg-[var(--brand-primary)] text-white font-black uppercase text-[10px] tracking-[0.2em] mt-2 shadow-lg shadow-[var(--brand-primary)]/10 active:scale-95 transition-all"
              onClick={handleOpenSession}
              disabled={isOpening}
            >
              {isOpening ? 'Iniciando turno...' : '✦ Iniciar Turno de Caja'}
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  // ═══════════════ RENDER BLOCK: ACTIVE DASHBOARD ═══════════════
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--border-soft)] pb-8">
        <div>
          <Badge variant="brand" className="mb-2">Módulo Financiero Activo</Badge>
          <Heading level={2}>
            <span className="font-[var(--font-serif)] italic">Caja</span> del Día
          </Heading>
          <p className="text-[var(--text-muted)] text-sm mt-1">Control de base de efectivo, arqueos diarios y gastos menores.</p>
        </div>

        {/* Subtabs Navigation */}
        <div className="flex bg-[var(--bg-secondary)] p-1 rounded-full border border-[var(--border-soft)] self-stretch md:self-auto">
          <button 
            onClick={() => setActiveSubTab("session")}
            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
              activeSubTab === "session" 
                ? "bg-[var(--surface-primary)] text-[var(--text-primary)] shadow-sm" 
                : "text-[var(--text-disabled)]"
            }`}
          >
            Turno Activo
          </button>
          <button 
            onClick={() => { setActiveSubTab("history"); fetchHistory(); }}
            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
              activeSubTab === "history" 
                ? "bg-[var(--surface-primary)] text-[var(--text-primary)] shadow-sm" 
                : "text-[var(--text-disabled)]"
            }`}
          >
            Auditoría / Historial
          </button>
        </div>
      </header>

      {activeSubTab === "session" ? (
        <div className="space-y-8">
          {/* Métricas Caja Activa */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="!p-5 text-center bg-white border border-gray-100">
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-disabled)] mb-1">Base Inicial</p>
              <p className="font-[var(--font-serif)] italic text-2xl font-bold text-gray-800">
                ${currentSession.base_amount.toLocaleString()}
              </p>
            </Card>
            <Card className="!p-5 text-center bg-green-50/20 border border-green-100/50">
              <p className="text-[9px] font-black uppercase tracking-widest text-green-700/60 mb-1">Ventas Efectivo (+)</p>
              <p className="font-[var(--font-serif)] italic text-2xl font-bold text-green-600">
                +${currentSession.cash_sales.toLocaleString()}
              </p>
            </Card>
            <Card className="!p-5 text-center bg-red-50/20 border border-red-100/50">
              <p className="text-[9px] font-black uppercase tracking-widest text-red-700/60 mb-1">Gastos Chica (-)</p>
              <p className="font-[var(--font-serif)] italic text-2xl font-bold text-red-600">
                -${currentSession.total_expenses.toLocaleString()}
              </p>
            </Card>
            <Card className="!p-5 text-center bg-amber-50/20 border border-amber-100/50">
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-700/80 mb-1">Esperado en Caja (=)</p>
              <p className="font-[var(--font-serif)] italic text-2xl font-bold text-[var(--brand-primary)]">
                ${currentSession.expected_cash.toLocaleString()}
              </p>
            </Card>
            <Card className="!p-5 text-center col-span-2 md:col-span-1 bg-blue-50/20 border border-blue-100/50">
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-700/60 mb-1">Wompi / Digital (Banco)</p>
              <p className="font-[var(--font-serif)] italic text-2xl font-bold text-blue-600">
                ${currentSession.digital_sales.toLocaleString()}
              </p>
            </Card>
          </div>

          {/* Fila de Controles Operacionales de Caja */}
          <div className="flex flex-wrap gap-4 bg-[var(--surface-primary)] border border-[var(--border-soft)] rounded-[2rem] p-6 shadow-sm">
            <div className="flex-1 min-w-[200px]">
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-disabled)] block mb-1">Operador</span>
              <p className="text-sm font-semibold">{currentSession.opened_by} <span className="text-[10px] text-green-500 font-bold ml-1">● Abierto</span></p>
              <span className="text-[10px] text-[var(--text-disabled)] font-bold">Desde: {new Date(currentSession.opened_at).toLocaleTimeString()}</span>
            </div>

            <div className="flex gap-3 self-center">
              <Button 
                onClick={() => setShowExpenseModal(true)}
                variant="secondary"
                className="py-3.5 px-6 text-[10px] font-black uppercase tracking-wider !rounded-xl"
              >
                💸 Registrar Gasto / Egreso
              </Button>
              <Button 
                onClick={() => setShowCloseModal(true)}
                className="py-3.5 px-6 text-[10px] font-black uppercase tracking-wider !rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/10"
              >
                🚪 Cerrar y Arquear Caja
              </Button>
            </div>
          </div>

          {/* Egresos del Turno Actual */}
          {currentSession.expenses?.length > 0 && (
            <Card className="!p-6">
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-disabled)] mb-4">Egresos de Caja Chica en este Turno</p>
              <div className="space-y-2.5">
                {currentSession.expenses.map(exp => (
                  <div key={exp.id} className="flex justify-between items-center bg-[var(--bg-secondary)] rounded-2xl px-4 py-3 border border-[var(--border-soft)]/20">
                    <div className="text-left">
                      <p className="text-xs font-bold">{exp.description}</p>
                      <span className="text-[9px] text-[var(--text-disabled)] font-bold uppercase">{new Date(exp.created_at).toLocaleTimeString()} · Por {exp.created_by}</span>
                    </div>
                    <span className="font-[var(--font-serif)] italic font-bold text-red-600">-${exp.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Mesas abiertas */}
          <div>
            <Heading level={3} className="!text-sm uppercase tracking-widest mb-4 text-[var(--text-disabled)]">
              🍽️ Mesas Abiertas en el Salón ({mesas.length})
            </Heading>
            
            {mesas.length === 0 ? (
              <EmptyState
                icon="✅"
                title="Todas las mesas cobradas"
                description="No hay comandas pendientes de cobro en este turno."
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
        </div>
      ) : (
        /* Historial de Cierres de Auditoría */
        <div className="space-y-6">
          <Heading level={3} className="!text-sm uppercase tracking-widest text-[var(--text-disabled)]">
            📋 Historial de Turnos de Caja Pasados
          </Heading>

          {history.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No hay registros históricos"
              description="Aún no se han completado cierres de caja en este inquilino."
            />
          ) : (
            <div className="space-y-4">
              {history.map(s => {
                const diffColor = s.discrepancy === 0 
                  ? "text-green-600" 
                  : (s.discrepancy > 0 ? "text-amber-600" : "text-red-600");
                const diffLabel = s.discrepancy === 0 
                  ? "Cuadrado" 
                  : (s.discrepancy > 0 ? `Sobrante: +$${s.discrepancy.toLocaleString()}` : `Faltante: -$${Math.abs(s.discrepancy).toLocaleString()}`);
                
                return (
                  <Card key={s.id} className="!p-6 border border-[var(--border-soft)] hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-[var(--border-soft)]/50 pb-4 mb-4">
                      <div>
                        <Badge variant="brand" className="mb-2">Turno #{s.id}</Badge>
                        <p className="text-xs text-[var(--text-disabled)] font-bold uppercase tracking-wider">
                          Apertura: {new Date(s.opened_at).toLocaleString()}
                        </p>
                        <p className="text-xs text-[var(--text-disabled)] font-bold uppercase tracking-wider">
                          Cierre: {s.closed_at ? new Date(s.closed_at).toLocaleString() : 'En proceso'}
                        </p>
                      </div>
                      <div className="text-left md:text-right">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-disabled)] block">Diferencia / Arqueo</span>
                        <p className={`font-[var(--font-serif)] italic text-lg font-black ${diffColor}`}>
                          {diffLabel}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <span className="text-[9px] font-black uppercase text-[var(--text-disabled)] block">Base Inicial</span>
                        <p className="font-semibold text-sm">${s.base_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase text-[var(--text-disabled)] block">Ventas Efectivo</span>
                        <p className="font-semibold text-sm">+${s.cash_sales.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase text-[var(--text-disabled)] block">Gastos</span>
                        <p className="font-semibold text-sm">-${s.total_expenses.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase text-[var(--text-disabled)] block">Arqueo Real Contado</span>
                        <p className="font-bold text-sm text-[var(--brand-primary)]">${s.real_cash?.toLocaleString() || 0}</p>
                      </div>
                    </div>

                    {s.notes && (
                      <div className="mt-4 pt-3 border-t border-[var(--border-soft)]/30 text-left text-xs italic text-[var(--text-muted)]">
                        "{s.notes}"
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Cobro / Cerrar Mesa */}
      <Modal 
        isOpen={!!mesaToClose} 
        onClose={() => setMesaToClose(null)}
        title={mesaToClose ? `Cerrar Mesa ${mesaToClose.table_number}` : ''}
      >
        {mesaToClose && (
          <div>
            <p className="text-[var(--text-muted)] text-sm mb-6 text-left">
              ¿Estás seguro de cobrar y liquidar la mesa? <br/><br/>
              El total es de <span className="font-bold text-[var(--brand-primary)] text-lg">${mesaToClose.total.toLocaleString()} COP</span>.
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

      {/* Modal para Añadir Producto a Mesa */}
      <Modal
        isOpen={!!tableToAdd}
        onClose={() => setTableToAdd(null)}
        title={tableToAdd ? `Añadir a Mesa ${tableToAdd}` : ''}
      >
        {tableToAdd && (
          <div className="space-y-4 text-left">
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

      {/* Modal para Registrar Egreso / Gasto Chica */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        title="Registrar Egreso de Caja Chica"
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-[var(--text-muted)]">Registra cualquier salida de dinero físico del cajón para compras urgentes o pagos menores.</p>
          
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Monto del Gasto (COP)</label>
            <input 
              type="number"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-soft)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand-primary)] font-semibold"
              placeholder="Ej. 15000"
              value={expenseAmount}
              onChange={e => setExpenseAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Concepto / Descripción</label>
            <input 
              type="text"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-soft)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand-primary)]"
              placeholder="Ej. Cilantro y limones para la cocina"
              value={expenseDesc}
              onChange={e => setExpenseDesc(e.target.value)}
            />
          </div>

          <div className="flex gap-4 mt-8 pt-4 border-t border-[var(--border-soft)]">
            <Button variant="secondary" className="flex-1" onClick={() => setShowExpenseModal(false)}>
              Cancelar
            </Button>
            <Button 
              className="flex-1 bg-[var(--brand-primary)] text-white" 
              onClick={handleAddExpense}
              disabled={isRegisteringExpense || !expenseAmount || !expenseDesc}
            >
              {isRegisteringExpense ? 'Registrando...' : '✓ Registrar Egreso'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal para Arqueo y Cierre de Caja */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Arqueo y Cierre de Turno"
      >
        {currentSession && (
          <div className="space-y-5 text-left">
            <p className="text-xs text-[var(--text-muted)]">Realiza el conteo físico de los billetes y monedas en el cajón de efectivo antes de bloquear el turno actual.</p>
            
            <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 space-y-2 border border-[var(--border-soft)]/50">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">Base de Caja inicial:</span>
                <span className="font-semibold">${currentSession.base_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">Ventas en Efectivo del turno (+):</span>
                <span className="font-semibold text-green-600">+${currentSession.cash_sales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">Gastos / Egresos del turno (-):</span>
                <span className="font-semibold text-red-600">-${currentSession.total_expenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-dashed border-[var(--border-soft)] font-bold">
                <span>Efectivo Esperado Auditable:</span>
                <span className="text-[var(--brand-primary)]">${currentSession.expected_cash.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Efectivo Real Contado en Cajón</label>
              <input 
                type="number"
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-soft)] rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[var(--brand-primary)] font-bold text-lg text-[var(--brand-primary)]"
                placeholder="Ingresa el dinero físico contado"
                value={realCash}
                onChange={e => setRealCash(e.target.value)}
              />
            </div>

            {realCash !== "" && (
              <div className="p-3 bg-[var(--bg-secondary)] rounded-xl text-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-disabled)] block mb-1">Diferencia de Arqueo</span>
                <p className={`font-[var(--font-serif)] italic text-lg font-black ${
                  liveDiscrepancy === 0 
                    ? "text-green-600" 
                    : (liveDiscrepancy > 0 ? "text-amber-600" : "text-red-600")
                }`}>
                  {liveDiscrepancy === 0 
                    ? "✓ Caja Perfecta (Cuadrada)" 
                    : (liveDiscrepancy > 0 ? `Sobrante: +$${liveDiscrepancy.toLocaleString()}` : `Faltante: -$${Math.abs(liveDiscrepancy).toLocaleString()}`)}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Notas de Cierre</label>
              <textarea 
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-soft)] rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[var(--brand-primary)] min-h-[50px]"
                placeholder="Ej. Se descuenta base de $100k, el resto se retira."
                value={closeNotes}
                onChange={e => setCloseNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-4 mt-8 pt-4 border-t border-[var(--border-soft)]">
              <Button variant="secondary" className="flex-1" onClick={() => setShowCloseModal(false)}>
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-red-600 text-white shadow-lg shadow-red-600/10" 
                onClick={handleCloseSession}
                disabled={isClosingSession || realCash === ""}
              >
                {isClosingSession ? 'Cerrando turno...' : '✓ Confirmar y Cerrar Caja'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};
