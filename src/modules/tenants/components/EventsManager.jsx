import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Heading, Badge, Button, Modal, EmptyState } from '../../../shared/ui';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

const STATUS_VARIANTS = {
  pending: 'brand',
  managing: 'brand',
  confirmed: 'success',
  rejected: 'error'
};

const STATUS_LABELS = {
  pending: 'Pendiente',
  managing: 'Gestionando',
  confirmed: 'Confirmado',
  rejected: 'Rechazado'
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
    <Modal isOpen={!!event} onClose={onClose} title={`${typeInfo.label} · #${event.id}`}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-3xl">{typeInfo.icon}</span>
            <Heading level={3} className="!text-xl uppercase tracking-tighter italic">{event.client_name}</Heading>
          </div>
          <Badge variant={STATUS_VARIANTS[event.status]}>{STATUS_LABELS[event.status]}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="!bg-[var(--bg-secondary)]/50 !p-4 border-[var(--border-soft)]">
            <p className="text-[9px] text-[var(--text-disabled)] uppercase tracking-[0.2em] font-bold mb-1">Fecha</p>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              {event.event_date
                ? new Date(event.event_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Por definir'}
            </p>
            {event.event_date && (
              <p className="text-[10px] text-[var(--text-disabled)] mt-0.5">
                {new Date(event.event_date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </Card>
          <Card className="!bg-[var(--bg-secondary)]/50 !p-4 border-[var(--border-soft)]">
            <p className="text-[9px] text-[var(--text-disabled)] uppercase tracking-[0.2em] font-bold mb-1">Personas</p>
            <p className="text-sm font-bold text-[var(--text-primary)]">{event.guests_count} invitados</p>
          </Card>
        </div>

        {event.extras && event.extras.length > 0 && (
          <div>
            <p className="text-[9px] text-[var(--text-disabled)] uppercase tracking-[0.2em] font-bold mb-3">Extras solicitados</p>
            <div className="flex flex-wrap gap-2">
              {event.extras.map(key => (
                <Badge key={key} variant="brand" className="!bg-[var(--brand-soft)] !text-[var(--brand-primary)]">
                  {EXTRAS_LABELS[key] || key}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {event.notes && (
          <Card className="!bg-[var(--bg-secondary)]/50 !p-4 border-[var(--border-soft)]">
            <p className="text-[9px] text-[var(--text-disabled)] uppercase tracking-[0.2em] font-bold mb-2">Notas del cliente</p>
            <p className="text-xs text-[var(--text-muted)] italic leading-relaxed">{event.notes}</p>
          </Card>
        )}

        <div className="flex items-center justify-between bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border-soft)]">
          <div>
            <p className="text-[9px] text-[var(--text-disabled)] uppercase tracking-[0.2em] font-bold mb-1">WhatsApp</p>
            <p className="text-sm font-bold text-[var(--text-primary)] font-mono">{event.client_phone}</p>
          </div>
          <Button 
            variant="secondary"
            onClick={() => window.open(`https://wa.me/${cleanPhone}?text=${waMessage}`, '_blank')}
            className="!py-2 !px-4 !text-[10px] uppercase font-bold"
          >
            Contactar 💬
          </Button>
        </div>

        <div>
          <p className="text-[9px] text-[var(--text-disabled)] uppercase tracking-[0.2em] font-bold mb-3">Estado de la gestión</p>
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(STATUS_LABELS).map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`p-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                  status === s
                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                    : 'bg-[var(--bg-secondary)] border-[var(--border-soft)] text-[var(--text-disabled)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Notas internas..."
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-soft)] p-4 rounded-2xl text-xs outline-none focus:border-[var(--brand-accent)] transition-colors resize-none placeholder-[var(--text-disabled)] text-[var(--text-primary)]"
          />
          <Button onClick={handleSave} isLoading={saving} className="w-full py-5 !rounded-2xl uppercase tracking-widest">
            Guardar Cambios
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export const EventsManager = ({ slug }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [tenantId, setTenantId] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/tenant/${slug}`)
      .then(r => r.json())
      .then(d => {
        setTenantId(d.data?.id || d.id);
        if (!(d.data?.id || d.id)) setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const fetchEvents = useCallback(async () => {
    if (!tenantId) return;
    try {
      const token = localStorage.getItem('hub_token');
      const statusParam = filter !== 'all' ? `?status=${filter}` : '';
      const res = await fetch(`${API_URL}/api/events/restaurant/${tenantId}${statusParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.warn('Events fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, filter]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const pendingCount = events.filter(e => e.status === 'pending').length;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <header className="border-b border-[var(--border-soft)] pb-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Badge variant="brand" className="mb-2">Eventos Especiales</Badge>
            <Heading level={2}>Gestión de <span className="font-[var(--font-serif)] italic">Reservas</span></Heading>
          </div>
          {pendingCount > 0 && (
            <Badge variant="brand" className="!bg-[var(--status-pending)] !text-white animate-pulse">
              {pendingCount} NUEVOS
            </Badge>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'managing', 'confirmed', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setLoading(true); }}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                filter === f
                  ? 'bg-[var(--text-primary)] text-white border-[var(--text-primary)] shadow-lg shadow-[var(--text-primary)]/20'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-disabled)] border-[var(--border-soft)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              {f === 'all' ? 'Todos' : STATUS_LABELS[f]}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-disabled)] font-bold">Syncing Records...</p>
        </div>
      ) : events.length === 0 ? (
        <EmptyState 
          icon="🎉"
          title="No hay solicitudes"
          description={filter === 'all' ? "Tus clientes pueden reservar eventos desde el menú digital." : `No se encontraron eventos en estado ${STATUS_LABELS[filter]}.`}
        />
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {events.map(event => {
              const typeInfo = EVENT_TYPE_LABELS[event.event_type] || EVENT_TYPE_LABELS.otro;
              return (
                <Card 
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="group !p-6 flex items-center gap-6 cursor-pointer hover:border-[var(--brand-accent)]/30"
                >
                  <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-soft)] text-3xl group-hover:scale-105 transition-transform">
                    {typeInfo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Heading level={4} className="!text-sm uppercase tracking-wider truncate">{event.client_name}</Heading>
                      <Badge variant={STATUS_VARIANTS[event.status]}>{STATUS_LABELS[event.status]}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-[var(--text-disabled)] font-bold uppercase tracking-widest">
                      <span>{typeInfo.label}</span>
                      <span>·</span>
                      <span>{event.guests_count} personas</span>
                      <span>·</span>
                      <span className="text-[var(--brand-accent)]">
                        {event.event_date ? new Date(event.event_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : 'TBD'}
                      </span>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-disabled)]">
                    <span className="text-2xl">›</span>
                  </div>
                </Card>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onStatusChange={fetchEvents}
        />
      )}
    </motion.div>
  );
};
