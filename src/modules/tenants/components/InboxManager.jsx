import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Heading, Badge, Button } from '../../../shared/ui';
import { useWebSocketContext } from '../../../shared/contexts/WebSocketContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const InboxManager = () => {
  const { lastMessage } = useWebSocketContext();
  const [chats, setChats] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Bot Settings State
  const [botEnabled, setBotEnabled] = useState(true);
  const [botPersonality, setBotPersonality] = useState('');
  const [savingBot, setSavingBot] = useState(false);

  const messagesEndRef = useRef(null);

  // 1. Fetch Chats list
  const fetchChats = async () => {
    setLoadingChats(true);
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/whatsapp/chats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setChats(json.data || []);
      }
    } catch (err) {
      console.error("Error loading chats:", err);
    } finally {
      setLoadingChats(false);
    }
  };

  // 2. Fetch messages for a specific chat
  const fetchMessages = async (phone) => {
    setLoadingMessages(true);
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/whatsapp/chats/${phone}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setMessages(json.data || []);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // 3. Fetch Bot settings
  const fetchBotSettings = async () => {
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/whatsapp/bot-settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setBotEnabled(json.data.chatbot_enabled);
        setBotPersonality(json.data.chatbot_personality);
      }
    } catch (err) {
      console.error("Error loading bot settings:", err);
    }
  };

  // 4. Save Bot settings
  const saveBotSettings = async () => {
    setSavingBot(true);
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/whatsapp/bot-settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          chatbot_enabled: botEnabled,
          chatbot_personality: botPersonality
        })
      });
      if (res.ok) {
        alert("🤖 Configuración del PlatoBot guardada con éxito.");
      }
    } catch (err) {
      console.error("Error saving bot settings:", err);
    } finally {
      setSavingBot(false);
    }
  };

  // 5. Send manual message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.strip || !replyText.trim() || !selectedPhone || sending) return;

    setSending(true);
    try {
      const token = localStorage.getItem('hub_token');
      const res = await fetch(`${API_URL}/api/admin/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: selectedPhone,
          body: replyText
        })
      });
      if (res.ok) {
        setReplyText('');
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  // Initial loads
  useEffect(() => {
    fetchChats();
    fetchBotSettings();
  }, []);

  // Fetch messages when selected chat changes
  useEffect(() => {
    if (selectedPhone) {
      fetchMessages(selectedPhone);
    }
  }, [selectedPhone]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket Live Listener
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        if (data.type === 'NEW_WHATSAPP_MESSAGE') {
          const newMsg = data.message;
          
          // Append message if it belongs to selected chat
          if (selectedPhone && newMsg.phone === selectedPhone) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, {
                id: newMsg.id,
                sender: newMsg.sender,
                body: newMsg.body,
                created_at: newMsg.created_at
              }];
            });
          }

          // Update/refresh chat list
          setChats(prevChats => {
            const existingChatIdx = prevChats.findIndex(c => c.phone === newMsg.phone);
            const updatedChat = {
              phone: newMsg.phone,
              customer_name: newMsg.customer_name || "Cliente de WhatsApp",
              last_message: newMsg.body,
              last_message_sender: newMsg.sender,
              created_at: newMsg.created_at
            };

            if (existingChatIdx > -1) {
              const clean = [...prevChats];
              clean.splice(existingChatIdx, 1);
              return [updatedChat, ...clean];
            } else {
              return [updatedChat, ...prevChats];
            }
          });
        }
      } catch (err) {
        console.error("Error processing websocket message:", err);
      }
    }
  }, [lastMessage, selectedPhone]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[var(--border-soft)] pb-8">
        <div>
          <Badge variant="brand" className="mb-2">Centro de Control</Badge>
          <Heading level={2}>WhatsApp <span className="font-[var(--font-serif)] italic">Inbox</span></Heading>
          <p className="text-[var(--text-muted)] text-sm mt-1">Interactúa en tiempo real con tus clientes y gestiona el Asistente AI.</p>
        </div>
      </header>

      {/* PLATOBOT AI CONFIGURATION PANEL */}
      <Card className="!rounded-[2.5rem] p-8 border border-[var(--brand-primary)]/20 bg-gradient-to-br from-white to-[var(--brand-soft)]/10 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🤖</span>
            <div>
              <Heading level={4} className="!text-base">PlatoBot Asistente de IA</Heading>
              <p className="text-xs text-[var(--text-muted)]">Responde de forma autónoma dudas sobre productos, precios y ubicación.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">Bot Activo</span>
            <button
              onClick={() => setBotEnabled(!botEnabled)}
              className={`w-14 h-8 rounded-full p-1 transition-all ${botEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <motion.div
                layout
                className="w-6 h-6 bg-white rounded-full shadow-md"
                animate={{ x: botEnabled ? 24 : 0 }}
              />
            </button>
          </div>
        </div>

        {botEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-black block">Instrucciones de Personalidad del Bot</label>
            <textarea
              value={botPersonality}
              onChange={(e) => setBotPersonality(e.target.value)}
              placeholder="Ej: Eres PlatoBot, el asistente del restaurante El Fogón. Responde siempre con entusiasmo, recomienda el plato del día y sé breve."
              className="w-full bg-white border border-[var(--border-soft)] rounded-2xl p-4 text-xs resize-none h-20 outline-none focus:border-[var(--brand-accent)] text-[var(--text-primary)]"
            />
            <div className="flex justify-end">
              <Button onClick={saveBotSettings} isLoading={savingBot} className="text-[9px] py-2.5 px-6 uppercase tracking-widest font-black !rounded-xl">
                Guardar Personalidad
              </Button>
            </div>
          </motion.div>
        )}
      </Card>

      {/* TWO-WAY INBOX PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px] items-stretch">
        {/* Left Side: Chats List */}
        <Card className="lg:col-span-1 flex flex-col p-6 h-full !rounded-[2.5rem] border border-[var(--border-soft)] overflow-hidden">
          <Heading level={4} className="mb-4 !text-sm uppercase tracking-widest text-[var(--text-muted)]">Conversaciones</Heading>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
            {loadingChats ? (
              <p className="text-center text-xs text-[var(--text-muted)] py-10">Cargando chats...</p>
            ) : chats.length === 0 ? (
              <p className="text-center text-xs text-[var(--text-muted)] py-10 italic">No hay chats de WhatsApp registrados.</p>
            ) : (
              chats.map(chat => (
                <button
                  key={chat.phone}
                  onClick={() => setSelectedPhone(chat.phone)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border flex items-center justify-between group ${selectedPhone === chat.phone ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white shadow-lg' : 'bg-[var(--bg-secondary)] border-[var(--border-soft)] hover:bg-white'}`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className={`text-xs font-black truncate ${selectedPhone === chat.phone ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                      {chat.customer_name}
                    </p>
                    <p className={`text-[10px] mt-0.5 font-bold ${selectedPhone === chat.phone ? 'text-white/60' : 'text-[var(--text-disabled)]'}`}>
                      +{chat.phone}
                    </p>
                    <p className={`text-[10px] mt-1.5 truncate italic ${selectedPhone === chat.phone ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                      {chat.last_message_sender === 'bot' && '🤖 Bot: '}
                      {chat.last_message_sender === 'agent' && '👤 Tú: '}
                      {chat.last_message_sender === 'system' && '⚙️ Alerta: '}
                      {chat.last_message}
                    </p>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-wider opacity-60 self-start mt-0.5 whitespace-nowrap`}>
                    {chat.created_at ? new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Right Side: Chat Window */}
        <Card className="lg:col-span-2 flex flex-col p-6 h-full !rounded-[2.5rem] border border-[var(--border-soft)] overflow-hidden bg-white">
          {selectedPhone ? (
            <div className="flex flex-col h-full">
              {/* Chat Header */}
              <div className="pb-4 border-b border-[var(--border-soft)] flex justify-between items-center flex-shrink-0">
                <div>
                  <Heading level={4} className="!text-sm">
                    {chats.find(c => c.phone === selectedPhone)?.customer_name || 'Cliente'}
                  </Heading>
                  <p className="text-[10px] text-[var(--text-muted)]">+{selectedPhone}</p>
                </div>
                <Badge variant="success">WhatsApp Cloud</Badge>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto py-6 space-y-4 pr-1 no-scrollbar">
                {loadingMessages ? (
                  <p className="text-center text-xs text-[var(--text-muted)] py-10">Cargando mensajes...</p>
                ) : (
                  messages.map(msg => {
                    const isFromMe = msg.sender === 'agent' || msg.sender === 'bot' || msg.sender === 'system';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-4 rounded-3xl text-xs leading-relaxed ${isFromMe ? (msg.sender === 'bot' ? 'bg-amber-50 text-amber-900 border border-amber-200' : msg.sender === 'system' ? 'bg-gray-100 text-gray-700 italic border border-gray-200' : 'bg-dark text-white') : 'bg-cream-deep/30 text-dark'}`}
                          style={{
                            borderRadius: isFromMe ? '24px 24px 4px 24px' : '24px 24px 24px 4px'
                          }}
                        >
                          <p>{msg.body}</p>
                          <span className="block text-[8px] opacity-40 text-right mt-1.5 font-black uppercase tracking-wider">
                            {msg.sender === 'bot' && '🤖 Bot • '}
                            {msg.sender === 'system' && '⚙️ Alerta • '}
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendMessage} className="pt-4 border-t border-[var(--border-soft)] flex items-center gap-3 flex-shrink-0">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escribe tu respuesta de WhatsApp..."
                  className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-soft)] rounded-full py-3 px-6 text-xs outline-none focus:border-[var(--brand-accent)] text-[var(--text-primary)]"
                />
                <Button
                  type="submit"
                  isLoading={sending}
                  disabled={!replyText.trim() || sending}
                  className="!rounded-full w-10 h-10 p-0 flex items-center justify-center !bg-dark text-white flex-shrink-0"
                >
                  🚀
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-40">
              <span className="text-5xl mb-4">💬</span>
              <Heading level={4} className="!text-sm">Selecciona una conversación</Heading>
              <p className="text-xs max-w-xs mt-1">Haz click en cualquiera de los chats a la izquierda para ver el historial y responder directamente.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
