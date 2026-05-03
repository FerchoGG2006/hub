import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/* ── CONSTANTES ── */
const STATUS_CONFIG = {
  pending:   { label: 'Pendiente', color: 'bg-orange-500', textColor: 'text-orange-400', bgLight: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
  managing:  { label: 'Gestionando', color: 'bg-yellow-500', textColor: 'text-yellow-400', bgLight: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' },
  confirmed: { label: 'Confirmado', color: 'bg-emerald-500', textColor: 'text-emerald-400', bgLight: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  rejected:  { label: 'Rechazado', color: 'bg-dark/30', textColor: 'text-dark/40', bgLight: 'bg-dark/5', borderColor: 'border-dark/10' },
};

const EVENT_TYPE_LABELS = {
  cumpleanos: { icon: '🎂', label: 'Cumpleaños' },
  aniversario: { icon: '💍', label: 'Aniversario' },
  reunion: { icon: '🤝', label: 'Reunión' },
  despedida: { icon: '🥂', label: 'Despedida' },
  otro: { icon: '✨', label: 'Otro' },
};

const EXTRAS_LABELS = {
  decoracion: 'Decoración especial',
  torta: 'Torta incluida',
  zona_privada: 'Zona privada',
  menu_especial: 'Menú especial',
  musica: 'Música',
};

/* ── STATUS BADGE ── */
const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] ${config.bgLight} ${config.textColor} border ${config.borderColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.color} ${status === 'pending' ? 'animate-pulse' : ''}`} />
      {config.label}
    </span>
  );
};

/* ── EVENT DETAIL MODAL ── */
const EventDetailModal = ({ event, onClose, onStatusChange }) => {
  const [status, setStatus] = useState(event.status);
  const [adminNotes, setAdminNotes] = useState(event.admin_notes || '');
  const [saving, setSaving] = useState(false);

  const typeInfo = EVENT_TYPE_LABELS[event.event_type] || EVENT_TYPE_LABELS.otro;

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/events/${event.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, admin_notes: adminNotes })
      });
      if (!res.ok) throw new Error('Error actualizando');
      onStatusChange();
      onClose();
    } catch (err) {
      alert('Error al guardar cambios: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const waMessage = encodeURIComponent(
    `Hola ${event.client_name}, recibimos tu solicitud de evento (${typeInfo.label}) para ${event.event_date ? new Date(event.event_date).toLocaleDateString('es-CO') : 'fecha por definir'}. Estamos revisando los detalles y te contactaremos pronto.`
  );
  const cleanPhone = (event.client_phone || '').replace(/\+/g, '').replace(/\s/g, '');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-dark/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        className="bg-bone border border-dark/10 rounded-[2.5rem] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_40px_100px_rgba(0,0,0,0.25)] relative"
      >
        {/* Header */}
        <div className="sticky top-0 bg-bone/95 backdrop-blur-md px-8 pt-8 pb-4 border-b border-dark/5 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{typeInfo.icon}</span>
              <div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-dark">{event.client_name}</h3>
                <p className="text-[9px] text-dark/40 uppercase tracking-[0.3em] font-bold">{typeInfo.label} · #{event.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-dark/5 border border-dark/10 flex items-center justify-center text-dark/40 hover:text-dark hover:bg-dark/10 transition-all"
            >
              ✕
            </button>
          </div>
          <StatusBadge status={event.status} />
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark/[0.03] border border-dark/5 rounded-2xl p-4">
              <p className="text-[9px] text-dark/40 uppercase tracking-[0.2em] font-bold mb-1">Fecha</p>
              <p className="text-sm font-bold text-dark">
                {event.event_date
                  ? new Date(event.event_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Por definir'}
              </p>
              {event.event_date && (
                <p className="text-[10px] text-dark/40 mt-0.5">
                  {new Date(event.event_date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
            <div className="bg-dark/[0.03] border border-dark/5 rounded-2xl p-4">
              <p className="text-[9px] text-dark/40 uppercase tracking-[0.2em] font-bold mb-1">Personas</p>
              <p className="text-sm font-bold text-dark">{event.guests_count} invitados</p>
            </div>
          </div>

          {/* Extras */}
          {event.extras && event.extras.length > 0 && (
            <div>
              <p className="text-[9px] text-dark/40 uppercase tracking-[0.2em] font-bold mb-3">Extras solicitados</p>
              <div className="flex flex-wrap gap-2">
                {event.extras.map(key => (
                  <span key={key} className="text-[10px] bg-amber-500/10 text-amber-700 border border-amber-500/20 px-3 py-1.5 rounded-full font-bold">
                    {EXTRAS_LABELS[key] || key}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Client Notes */}
          {event.notes && (
            <div className="bg-dark/[0.03] border border-dark/5 rounded-2xl p-4">
              <p className="text-[9px] text-dark/40 uppercase tracking-[0.2em] font-bold mb-2">Notas del cliente</p>
              <p className="text-xs text-dark/70 italic leading-relaxed">{event.notes}</p>
            </div>
          )}

          {/* Contact */}
          <div className="bg-dark/[0.03] border border-dark/5 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[9px] text-dark/40 uppercase tracking-[0.2em] font-bold mb-1">WhatsApp del cliente</p>
              <p className="text-sm font-bold text-dark font-mono">{event.client_phone}</p>
            </div>
            <a
              href={`https://wa.me/${cleanPhone}?text=${waMessage}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 hover:bg-emerald-500/20 transition-all"
            >
              <span className="text-lg">💬</span>
              <span className="text-[9px] font-black uppercase tracking-widest">Contactar</span>
            </a>
          </div>

          {/* Status Selector */}
          <div>
            <p className="text-[9px] text-dark/40 uppercase tracking-[0.2em] font-bold mb-3">Cambiar estado</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(STATUS_CONFIG).map(s => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-[0.15em] transition-all ${
                      status === s
                        ? `${cfg.bgLight} ${cfg.textColor} ${cfg.borderColor}`
                        : 'bg-dark/[0.02] border-dark/5 text-dark/30 hover:bg-dark/[0.05]'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Admin Notes */}
          <div>
            <p className="text-[9px] text-dark/40 uppercase tracking-[0.2em] font-bold mb-2">
              Notas internas <span className="text-dark/20">(solo admin)</span>
            </p>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Notas internas sobre este evento..."
              rows={3}
              className="w-full bg-dark/5 border border-dark/10 p-4 rounded-2xl text-xs outline-none focus:border-amber-500 transition-colors resize-none placeholder-dark/20 text-dark"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 pb-2">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-dark/5 text-dark/40 uppercase text-[10px] font-black rounded-2xl tracking-widest hover:bg-dark/10 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-4 font-black uppercase tracking-[0.3em] text-[10px] text-bone bg-dark rounded-2xl shadow-xl transition-all tactile-button"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>

          {/* Created At */}
          <p className="text-[8px] text-dark/20 text-center font-mono uppercase tracking-widest pb-2">
            Solicitud recibida: {event.created_at ? new Date(event.created_at).toLocaleString('es-CO') : 'N/A'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ════════════════════════════════════════════
   EVENTS MANAGER (Admin Dashboard Section)
   ════════════════════════════════════════════ */
export const EventsManager = ({ tenantSlug }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [tenantId, setTenantId] = useState(null);

  // Resolve tenant ID from slug
  useEffect(() => {
    fetch(`${API_URL}/api/v1/tenant/${tenantSlug}`)
      .then(r => r.json())
      .then(d => setTenantId(d.id))
      .catch(() => {});
  }, [tenantSlug]);

  const fetchEvents = useCallback(async () => {
    if (!tenantId) return;
    try {
      const token = localStorage.getItem('hub_token');
      const statusParam = filter !== 'all' ? `?status=${filter}` : '';
      const res = await fetch(`${API_URL}/api/events/restaurant/${tenantId}${statusParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error fetching events');
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.warn('EventsManager fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, filter]);

  // Initial fetch + polling every 30s
  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const pendingCount = events.filter(e => e.status === 'pending').length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Header */}
      <header className="mb-8 border-b border-dark/10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-light text-dark mb-2 tracking-tight">
              Eventos <span className="text-amber-500 font-serif italic">Especiales</span>
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-dark/40">
              Gestiona solicitudes de eventos privados
            </p>
          </div>
          {pendingCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full"
            >
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
              </span>
            </motion.div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'pending', label: 'Pendientes' },
            { key: 'managing', label: 'Gestionando' },
            { key: 'confirmed', label: 'Confirmados' },
            { key: 'rejected', label: 'Rechazados' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setLoading(true); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border ${
                filter === f.key
                  ? 'bg-dark text-bone border-dark shadow-lg'
                  : 'bg-dark/[0.03] text-dark/40 border-dark/5 hover:bg-dark/[0.08]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {/* Events List */}
      {loading ? (
        <div className="text-center p-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto"
          />
          <p className="text-[9px] text-dark/30 uppercase tracking-[0.4em] mt-4 font-mono font-bold">
            SYNC_EVENTS_DB...
          </p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center p-16 bg-dark/[0.02] border border-dark/5 rounded-[2.5rem]">
          <span className="text-5xl block mb-4">🎉</span>
          <p className="text-dark/30 text-xs uppercase tracking-[0.3em] font-bold">
            {filter === 'all' ? 'No hay solicitudes de eventos aún' : `No hay eventos ${filter}`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {events.map(event => {
              const typeInfo = EVENT_TYPE_LABELS[event.event_type] || EVENT_TYPE_LABELS.otro;
              return (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={() => setSelectedEvent(event)}
                  className="bg-dark/[0.03] border border-dark/5 p-5 rounded-[2rem] flex items-center gap-5 transition-all hover:bg-dark/[0.07] cursor-pointer group relative"
                >
                  {/* Event Type Icon */}
                  <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-2xl bg-dark/5 border border-dark/5 text-2xl">
                    {typeInfo.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xs font-black uppercase tracking-[0.1em] text-dark truncate">
                        {event.client_name}
                      </h4>
                      <StatusBadge status={event.status} />
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-dark/40">
                      <span>{typeInfo.label}</span>
                      <span>·</span>
                      <span>{event.guests_count} personas</span>
                      <span>·</span>
                      <span>
                        {event.event_date
                          ? new Date(event.event_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
                          : 'Fecha TBD'}
                      </span>
                    </div>
                  </div>

                  {/* Arrow Hint */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-dark/20">
                    <span className="text-lg">›</span>
                  </div>

                  {/* Pending glow */}
                  {event.status === 'pending' && (
                    <div className="absolute inset-0 rounded-[2rem] border-2 border-orange-500/10 pointer-events-none" />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="text-center pt-4">
        <p className="text-[8px] text-dark/15 uppercase tracking-[0.5em] font-mono">
          Auto-refresh: 30s · {events.length} registros
        </p>
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onStatusChange={fetchEvents}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
