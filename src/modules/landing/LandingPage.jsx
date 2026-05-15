import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'home';
  });
  const [isNavSolid, setIsNavSolid] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginPasscode, setLoginPasscode] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Router Logic
  const goTo = (id) => {
    setActivePage(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.history.pushState({}, '', '#' + id);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    setIsLoggingIn(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', loginPasscode);

      const res = await fetch(`${API_URL}/api/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });
      if (!res.ok) throw new Error("Credenciales incorrectas");
      const data = await res.json();
      localStorage.setItem('hub_token', data.access_token);
      localStorage.setItem('hub_role', data.role);
      localStorage.setItem('hub_tenant', data.tenant_slug);
      
      if (data.role === 'superadmin') navigate('/superadmin');
      else navigate(`/admin/${data.tenant_slug}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) setActivePage(hash);
      else setActivePage('home');
    };
    window.addEventListener('popstate', handlePopState);
    
    const handleScroll = () => {
      setIsNavSolid(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Reveal Animation Logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('on');
          }
        });
      },
      { threshold: 0.08 }
    );

    const reveals = document.querySelectorAll('.rv');
    reveals.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [activePage]);

  // FAQ Toggling
  const toggleFaq = (e) => {
    const item = e.currentTarget.closest('.faq-item');
    const answer = item.querySelector('.faq-a');
    const isOpen = item.classList.contains('open');
    
    document.querySelectorAll('.faq-item.open').forEach((i) => {
      i.classList.remove('open');
      i.querySelector('.faq-a').classList.remove('open');
    });

    if (!isOpen) {
      item.classList.add('open');
      answer.classList.add('open');
    }
  };

  // Form Submission
  const submitForm = () => {
    const nombre = document.getElementById('f-nombre').value.trim();
    const contacto = document.getElementById('f-contacto').value.trim();
    const ciudad = document.getElementById('f-ciudad').value.trim();
    const plan = document.getElementById('f-plan').value;
    const mensaje = document.getElementById('f-mensaje').value.trim();

    if (!nombre || !contacto) {
      alert('Por favor completa al menos el nombre del restaurante y tu nombre.');
      return;
    }

    const text = `Hola Platorin! Quiero empezar 🙌\n\n🍽 Restaurante: ${nombre}\n👤 Nombre: ${contacto}\n📍 Ciudad: ${ciudad || 'No indicada'}\n📋 Plan de interés: ${plan || 'No seleccionado'}\n💬 Mensaje: ${mensaje || 'Ninguno'}`;
    window.open('https://wa.me/573005390069?text=' + encodeURIComponent(text), '_blank');
    setFormSuccess(true);
  };

  return (
    <div className="landing-container">
      {/* NAV */}
      <nav id="nav" className={isNavSolid ? 'solid' : ''}>
        <div className="logo" onClick={() => goTo('home')}>Plato<b>rin</b></div>
        <div className="nav-r">
          <button className="nav-link" onClick={() => goTo('como-funciona')}>Cómo funciona</button>
          <button className="nav-link" onClick={() => goTo('precios')}>Precios</button>
          <button className="nav-link" onClick={() => goTo('historia')}>Nosotros</button>
          <button className="nav-link" onClick={() => setShowLogin(true)}>Entrar</button>
          <button className="nav-cta" onClick={() => navigate('/register')}>Empezar gratis</button>
        </div>
        <button 
          className="nav-mobile-btn" 
          onClick={(e) => { 
            e.preventDefault();
            e.stopPropagation();
            setShowMobileMenu(true); 
          }} 
          aria-label="Menú"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      {showMobileMenu && (
        <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}>
          <div className="mobile-menu-card" onClick={e => e.stopPropagation()}>
            <button className="close-mobile-menu" onClick={() => setShowMobileMenu(false)}>✕</button>
            <div className="mobile-menu-logo">Plato<b>rin</b></div>
            <div className="mobile-menu-links">
              <button className="mobile-menu-link" onClick={(e) => { e.preventDefault(); goTo('como-funciona'); setShowMobileMenu(false); }}>Cómo funciona</button>
              <button className="mobile-menu-link" onClick={(e) => { e.preventDefault(); goTo('precios'); setShowMobileMenu(false); }}>Precios</button>
              <button className="mobile-menu-link" onClick={(e) => { e.preventDefault(); goTo('historia'); setShowMobileMenu(false); }}>Nosotros</button>
              <button className="mobile-menu-link" onClick={(e) => { e.preventDefault(); setShowLogin(true); setShowMobileMenu(false); }}>Entrar</button>
              <button className="mobile-menu-cta" onClick={(e) => { e.preventDefault(); setShowMobileMenu(false); navigate('/register'); }}>Empezar gratis</button>
            </div>
            <div className="mobile-menu-footer">
              <p>Nacidos en Valledupar 🇨🇴</p>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {showLogin && (
        <div className="login-modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="login-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowLogin(false)}>×</button>
            <div className="login-header">
              <div className="login-logo">Plato<b>rin</b></div>
              <h3>Bienvenido de nuevo</h3>
              <p>Ingresa tu código de acceso para gestionar tu restaurante.</p>
            </div>
            <form onSubmit={handleLogin}>
              <div className="form-field">
                <label className="form-label">Email o Usuario</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="admin@tu-restaurante.com" 
                  name="username"
                  required
                />
              </div>
              <div className="form-field">
                <label className="form-label">Código Passcode</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••" 
                  value={loginPasscode}
                  onChange={e => setLoginPasscode(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-filled" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} disabled={isLoggingIn}>
                {isLoggingIn ? 'Verificando...' : 'Entrar al Panel'}
              </button>
            </form>
            <p className="login-footer">¿Olvidaste tu código? <a href="https://wa.me/573001234567" target="_blank">Contactar soporte</a></p>
          </div>
        </div>
      )}

      {/* WA FAB */}
      <a href="https://wa.me/573001234567?text=Hola%2C%20quiero%20saber%20más%20sobre%20Platorin" target="_blank" className="wa-fab" aria-label="WhatsApp">
        <svg width="26" height="26" fill="white" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a8.26 8.26 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.112 1.523 5.835L0 24l6.341-1.5A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.813 9.813 0 01-4.984-1.361l-.357-.212-3.766.889.929-3.657-.232-.375A9.818 9.818 0 012.182 12C2.182 6.568 6.568 2.182 12 2.182S21.818 6.568 21.818 12 17.432 21.818 12 21.818z" />
        </svg>
      </a>

      {/* PAGE: HOME */}
      <div id="page-home" className={`page ${activePage === 'home' ? 'active' : ''}`}>
        <section className="hero">
          <div className="hero-left">
            <div className="hero-eyebrow"><div className="eyebrow-dot"></div><span className="eyebrow-text">Más de 200 restaurantes en Colombia</span></div>
            <h1>Tu menú digital.<br /><span className="italic-line">Tus pedidos en orden.</span></h1>
            <p className="hero-sub">Digitaliza tu carta y recibe cada pedido organizado directamente en WhatsApp. Sin apps que descargar, sin complicaciones, sin perder ninguno.</p>
            <div className="hero-ctas">
              <button className="btn-filled" onClick={() => navigate('/register')}>Empezar gratis 14 días →</button>
              <button className="btn-outline" onClick={() => goTo('como-funciona')}>Ver cómo funciona</button>
            </div>
            <div className="hero-trust">
              <div className="trust-faces"><div className="trust-face">JR</div><div className="trust-face">MC</div><div className="trust-face">AT</div><div className="trust-face">LP</div></div>
              <div className="trust-text"><strong>+200 restaurantes</strong><br />ya organizan sus pedidos con Platorin</div>
            </div>
          </div>
          <div className="hero-visual">
            <div style={{ position: 'relative' }}>
              <div className="fc fc1"><div className="fc-ico g">✅</div><div><div className="fc-label">Pedido confirmado</div><div className="fc-sub">Bandeja paisa · $25.000</div></div></div>
              <div className="phone-outer">
                <div className="phone-notch"></div>
                <div className="phone-screen">
                  <div className="wa-header"><div className="wa-av">🍽</div><div className="wa-info"><div className="wn">Donde Juancho</div><div className="ws">en línea</div></div></div>
                  <div className="chat-body">
                    <div className="bb r a1">Hola! Vi el QR en la mesa, ¿tienen bandeja hoy? 😊<div className="tt">12:03</div></div>
                    <div className="bb s a2">¡Claro que sí! 🍛 Bandeja completa con chicharrón, frijoles, arroz, carne y jugo. $25.000. ¿La pedimos?<div className="tt">12:03</div></div>
                    <div className="bb r a3">Sí por favor! Pago con Wompi 💳<div className="tt">12:04</div></div>
                    <div className="bb s a4">Listo, tu pedido está en cocina 🔥 El pago es por el link de Wompi que te envío ahora.<div className="tt">12:04</div></div>
                    <div className="bb r a5">Gracias! 🙌<div className="tt">12:05</div></div>
                  </div>
                  <div className="wa-compose"><div className="wa-field">Escribe un mensaje</div><div className="wa-btn"><svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg></div></div>
                </div>
              </div>
              <div className="fc fc2"><div className="fc-ico w">💳</div><div><div className="fc-label">Pago con Wompi</div><div className="fc-sub">Rápido y seguro</div></div></div>
            </div>
          </div>
        </section>

        <div className="ticker">
          <div className="ticker-track">
            <div className="tick-item"><span className="tick-sep">✦</span> Carta digital en <strong>15 minutos</strong></div>
            <div className="tick-item"><span className="tick-sep">✦</span> Pedidos organizados a <strong>WhatsApp</strong></div>
            <div className="tick-item"><span className="tick-sep">✦</span> Cobros seguros con <strong>Wompi</strong></div>
            <div className="tick-item"><span className="tick-sep">✦</span> Nacidos en <strong>Valledupar, Cesar</strong></div>
            <div className="tick-item"><span className="tick-sep">✦</span> 0 apps que descargar</div>
            <div className="tick-item"><span className="tick-sep">✦</span> Soporte en <strong>español por WhatsApp</strong></div>
            <div className="tick-item"><span className="tick-sep">✦</span> +200 restaurantes en <strong>Colombia</strong></div>
            {/* Duplicated for smooth loop */}
            <div className="tick-item"><span className="tick-sep">✦</span> Carta digital en <strong>15 minutos</strong></div>
            <div className="tick-item"><span className="tick-sep">✦</span> Pedidos organizados a <strong>WhatsApp</strong></div>
            <div className="tick-item"><span className="tick-sep">✦</span> Cobros seguros con <strong>Wompi</strong></div>
            <div className="tick-item"><span className="tick-sep">✦</span> Nacidos en <strong>Valledupar, Cesar</strong></div>
            <div className="tick-item"><span className="tick-sep">✦</span> 0 apps que descargar</div>
            <div className="tick-item"><span className="tick-sep">✦</span> Soporte en <strong>español por WhatsApp</strong></div>
            <div className="tick-item"><span className="tick-sep">✦</span> +200 restaurantes en <strong>Colombia</strong></div>
          </div>
        </div>

        <section className="sect">
          <div className="rv">
            <h2 className="sh">¿Cuántos pedidos perdiste hoy<br />en <span className="si">WhatsApp?</span></h2>
            <p className="ss">El 78% de restaurantes en Colombia toman pedidos por WhatsApp. Sin organización, cada mensaje es caos que se convierte en pérdida.</p>
          </div>
          <div className="prob-wrap">
            <div className="pc rv d1"><div className="pc-n">01</div><h3>Mensajes perdidos</h3><p>El pedido llega mientras atiendes otra mesa. Lo olvidas. El cliente espera. Te deja mala reseña.</p></div>
            <div className="pc rv d2"><div className="pc-n">02</div><h3>Errores en cocina</h3><p>Abreviaturas en el chat, plato equivocado, desperdicio. Cocina no debería adivinar qué pide el cliente.</p></div>
            <div className="pc rv d3"><div className="pc-n">03</div><h3>Cero visibilidad</h3><p>No sabes cuánto vendiste hoy, qué plato sale más ni cuántos pedidos llegaron. Todo enterrado en chats.</p></div>
          </div>
        </section>

        <section className="how-sect">
          <div className="rv">
            <h2 className="sh sh-white">De caos a control<br />en <span className="si">3 pasos.</span></h2>
            <p className="ss ss-white">Sin técnicos. Listo desde el celular en 15 minutos.</p>
          </div>
          <div className="steps-wrap">
            <div className="step rv d1"><div className="step-n">01</div><div className="step-ico">🍽️</div><h3>Sube tu menú</h3><p>Agrega platos, fotos y precios desde el panel. Tienes menú en PDF — lo subimos por ti.</p></div>
            <div className="step rv d2"><div className="step-n">02</div><div className="step-ico">📲</div><h3>Comparte el QR o link</h3><p>Ponlo en mesas, en Instagram o en la bolsa del domicilio. El cliente lo abre sin descargar nada.</p></div>
            <div className="step rv d3"><div className="step-n">03</div><div className="step-ico">✅</div><h3>Recibe pedidos organizados</h3><p>Cada pedido llega a tu WhatsApp con plato, cantidad y método de pago. Sin errores, sin interpretaciones.</p></div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}><button className="btn-wa" onClick={() => goTo('como-funciona')}>Ver guía completa →</button></div>
        </section>

        <section className="feat-sect">
          <div className="rv">
            <h2 className="sh">Todo lo que necesitas.<br /><span className="si">Nada que no uses.</span></h2>
          </div>
          <div className="feat-grid">
            <div className="feat rv d1"><div className="feat-ico">🖼️</div><div><h3>Carta visual con fotos</h3><p>Menú con categorías, fotos y precios. El cliente ve lo que va a pedir — menos preguntas, más ventas.</p></div></div>
            <div className="feat rv d2"><div className="feat-ico">💬</div><div><h3>Pedidos directos a WhatsApp</h3><p>El pedido llega completo al número que ya usas. Sin apps nuevas para ti ni para tu equipo.</p></div></div>
            <div className="feat rv d1"><div className="feat-ico">💳</div><div><h3>Cobros rápidos con Wompi <span className="wompi-badge">Wompi</span></h3><p>El cliente paga con tarjeta, PSE o Nequi vía Wompi — sin efectivo, sin riesgo, sin esperas. El cobro llega directamente a tu cuenta.</p></div></div>
            <div className="feat rv d2"><div className="feat-ico">📊</div><div><h3>Panel de ventas en tiempo real</h3><p>Cuánto vendiste, qué plato va más, cuántos pedidos recibiste hoy — desde el celular, en segundos.</p></div></div>
            <div className="feat rv d1"><div className="feat-ico">🎯</div><div><h3>QR personalizado con tu logo</h3><p>Para imprimir en mesas, domicilios, pendones y redes. Incluido en todos los planes.</p></div></div>
            <div className="feat rv d2"><div className="feat-ico">🇨🇴</div><div><h3>Hecho para Colombia</h3><p>En español, en pesos, con soporte por WhatsApp. Sin formularios, sin esperas, sin letra pequeña.</p></div></div>
          </div>
        </section>

        <section className="origin-sect">
          <div className="rv">
            <div className="origin-tag">🪗 Nuestro origen</div>
            <h2>Nacimos en Valledupar.<br />Crecimos en<br /><span className="si">toda Colombia.</span></h2>
            <p>Platorin nació en Valledupar, Cesar — donde la gastronomía es identidad, el vallenato es cultura y los restaurantes se llenan a mediodía. Vimos de cerca cómo los dueños perdían pedidos y no dormían por el caos del WhatsApp.</p>
            <div className="origin-quote"><p>Conocemos el caos del almuerzo del mediodía porque lo vivimos primero aquí, en casa.</p><cite>— Equipo Platorin, Valledupar, Cesar</cite></div>
            <button className="btn-outline" onClick={() => goTo('historia')} style={{ marginTop: '0.5rem' }}>Conocer nuestra historia →</button>
          </div>
          <div className="rv d2">
            <div className="city-panel">
              <div className="city-header">Restaurantes activos en Colombia</div>
              <div className="city-row"><div className="city-dot cd-home"></div><div className="city-name">Valledupar, Cesar</div><div className="city-badge cb-home">Casa</div></div>
              <div className="city-row"><div className="city-dot cd-on"></div><div className="city-name">Barranquilla</div><div className="city-badge cb-on">Activo</div></div>
              <div className="city-row"><div className="city-dot cd-on"></div><div className="city-name">Bogotá</div><div className="city-badge cb-on">Activo</div></div>
              <div className="city-row"><div className="city-dot cd-on"></div><div className="city-name">Medellín</div><div className="city-badge cb-on">Activo</div></div>
              <div className="city-row"><div className="city-dot cd-on"></div><div className="city-name">Cali</div><div className="city-badge cb-on">Activo</div></div>
              <div className="city-row"><div className="city-dot cd-on"></div><div className="city-name">Santa Marta · Montería · Cúcuta…</div><div className="city-badge cb-on">Activo</div></div>
            </div>
          </div>
        </section>

        <section className="testi-sect">
          <div className="rv" style={{ textAlign: 'center' }}>
            <h2 className="sh">Lo que dicen los restaurantes<br />que <span className="si">ya lo usan</span></h2>
          </div>
          <div className="testi-grid">
            <div className="testi rv d1"><div className="testi-stars">★★★★★</div><p className="testi-text">"Antes me llegaban 20 mensajes para un solo pedido y siempre había errores. Ahora llega completo y organizado. Me quitaron un peso de encima."</p><div className="testi-author"><div className="testi-av" style={{ background: 'var(--green)' }}>JR</div><div><div className="testi-name">Juancho Romero</div><div className="testi-place">Donde Juancho — Valledupar, Cesar</div></div></div></div>
            <div className="testi rv d2"><div className="testi-stars">★★★★★</div><p className="testi-text">"Mis clientes ven las fotos del menú antes de pedir. Los pedidos de bandeja subieron casi un 40% desde que metí las fotos."</p><div className="testi-author"><div className="testi-av" style={{ background: 'var(--gold)' }}>MC</div><div><div className="testi-name">María Casas</div><div className="testi-place">La Parrilla del Sinú — Montería</div></div></div></div>
            <div className="testi rv d3"><div className="testi-stars">★★★★★</div><p className="testi-text">"Yo no sé de tecnología y lo configuré solo en una hora. El soporte por WhatsApp es inmediato. No me ha fallado ni una vez."</p><div className="testi-author"><div className="testi-av" style={{ background: '#2563EB' }}>AT</div><div><div className="testi-name">Andrés Tovar</div><div className="testi-place">El Rincón Paisa — Medellín</div></div></div></div>
          </div>
        </section>

        <section className="price-sect">
          <div className="rv" style={{ textAlign: 'center' }}>
            <h2 className="sh sh-white">Sin sorpresas.<br /><span className="si">Sin letra pequeña.</span></h2>
            <p className="ss ss-white" style={{ margin: '0 auto' }}>Cancela cuando quieras. Soporte en español por WhatsApp en todos los planes.</p>
          </div>
          <div className="price-grid">
            <div className="pc2 rv d1"><div className="pname">Gratis</div><div className="pamt">$0</div><div className="pperiod">Para empezar, sin tarjeta</div><div className="pline"></div><ul className="plist"><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>1 carta digital activa</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Hasta 50 pedidos al mes</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Código QR incluido</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Pedidos por WhatsApp</li></ul><button className="pbtn pbtn-o" onClick={() => goTo('contacto')}>Empezar gratis</button></div>
            <div className="pc2 feat-p rv d2"><div className="pb">Más popular</div><div className="pname">Pro</div><div className="pamt">$89<small>.000 COP</small></div><div className="pperiod">por mes · cancela cuando quieras</div><div className="pline"></div><ul className="plist"><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Cartas y pedidos ilimitados</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>QR personalizado con tu logo</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Panel de estadísticas</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Cobros con Wompi incluido</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Soporte prioritario por WhatsApp</li></ul><button className="pbtn pbtn-s" onClick={() => goTo('contacto')}>Empezar con Pro</button></div>
            <div className="pc2 rv d3"><div className="pname">Cadena</div><div className="pamt">$189<small>.000 COP</small></div><div className="pperiod">por mes · hasta 5 sedes</div><div className="pline"></div><ul className="plist"><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Todo lo del plan Pro</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Hasta 5 sedes en un panel</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Informes de ventas por sede</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Onboarding personalizado</li></ul><button className="pbtn pbtn-o" onClick={() => goTo('contacto')}>Hablar con ventas</button></div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}><button className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }} onClick={() => goTo('precios')}>Ver comparación completa →</button></div>
        </section>

        <section className="cta-sect">
          <h2 className="rv">Tu restaurante merece más que<br /><span className="si">WhatsApp sin organizar.</span></h2>
          <p className="rv d1">Empieza hoy. En 15 minutos tienes tu carta lista y tus pedidos ordenados.</p>
          <div className="cta-row rv d2">
            <button className="btn-dark" onClick={() => navigate('/register')}>Empezar gratis →</button>
            <a href="https://wa.me/573001234567?text=Hola%2C%20quiero%20probar%20Platorin" target="_blank" className="btn-wa">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a8.26 8.26 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.112 1.523 5.835L0 24l6.341-1.5A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.813 9.813 0 01-4.984-1.361l-.357-.212-3.766.889.929-3.657-.232-.375A9.818 9.818 0 012.182 12C2.182 6.568 6.568 2.182 12 2.182S21.818 6.568 21.818 12 17.432 21.818 12 21.818z" /></svg>
              Hablar por WhatsApp
            </a>
          </div>
        </section>

        <footer>
          <div className="footer-grid">
            <div><div className="footer-logo" onClick={() => goTo('home')}>Plato<b>rin</b></div><p className="footer-desc">Carta digital y pedidos por WhatsApp para restaurantes en toda Colombia. Nacidos en Valledupar, Cesar.</p></div>
            <div><div className="fc-title">Producto</div><button className="fc-link" onClick={() => goTo('como-funciona')}>Cómo funciona</button><button className="fc-link" onClick={() => goTo('precios')}>Precios</button><button className="fc-link" onClick={() => goTo('contacto')}>Demo gratuita</button></div>
            <div><div className="fc-title">Empresa</div><button className="fc-link" onClick={() => goTo('historia')}>Nuestra historia</button><button className="fc-link" onClick={() => goTo('blog')}>Blog</button><button className="fc-link" onClick={() => goTo('contacto')}>Contacto</button></div>
            <div><div className="fc-title">Soporte</div><button className="fc-link" onClick={() => goTo('ayuda')}>Centro de ayuda</button><a href="https://wa.me/573001234567" target="_blank" className="fc-link">WhatsApp directo</a><button className="fc-link" onClick={() => goTo('privacidad')}>Privacidad</button></div>
          </div>
          <div className="footer-bottom"><span className="footer-cr">© 2026 Platorin. Todos los derechos reservados.</span><div className="footer-made">Hecho con <span>♥</span> en Valledupar, Colombia 🇨🇴</div></div>
        </footer>
      </div>

      {/* PAGE: CÓMO FUNCIONA */}
      <div id="page-como-funciona" className={`page ${activePage === 'como-funciona' ? 'active' : ''}`}>
        <div className="page-hero">
          
          <h2 className="sh">Cómo funciona <span className="si">Platorin</span></h2>
          <p className="ss" style={{ textAlign: 'center', margin: '0 auto' }}>De la primera configuración al primer pedido organizado, en menos de 15 minutos.</p>
        </div>

        <div className="stats-row">
          <div className="stat-item"><div className="stat-num"><span>15</span> min</div><div className="stat-label">Para estar configurado</div></div>
          <div className="stat-item"><div className="stat-num"><span>3x</span></div><div className="stat-label">Más pedidos organizados</div></div>
          <div className="stat-item"><div className="stat-num"><span>0</span></div><div className="stat-label">Apps que descargar</div></div>
        </div>

        <section className="sect">
          <div className="rv">
            <h2 className="sh">Paso a paso para<br /><span className="si">comenzar hoy.</span></h2>
          </div>
          <div className="steps-wrap" style={{ borderColor: 'var(--border)', background: 'var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginTop: '3rem' }}>
            <div className="step rv d1" style={{ background: 'white', borderRightColor: 'var(--border)' }}>
              <div className="step-n" style={{ color: 'var(--cream-mid)' }}>01</div>
              <div className="step-ico" style={{ background: 'var(--green-light)', borderColor: 'rgba(26,92,54,0.15)' }}>📋</div>
              <h3 style={{ color: 'var(--ink)' }}>Crea tu cuenta</h3>
              <p style={{ color: 'var(--ink-50)' }}>Ingresa a platorin.com y crea tu cuenta en menos de 2 minutos. No necesitas tarjeta de crédito para el plan gratuito.</p>
            </div>
            <div className="step rv d2" style={{ background: 'white', borderRightColor: 'var(--border)' }}>
              <div className="step-n" style={{ color: 'var(--cream-mid)' }}>02</div>
              <div className="step-ico" style={{ background: 'var(--green-light)', borderColor: 'rgba(26,92,54,0.15)' }}>🍽️</div>
              <h3 style={{ color: 'var(--ink)' }}>Sube tu menú</h3>
              <p style={{ color: 'var(--ink-50)' }}>Agrega tus platos con nombre, descripción, precio y foto desde el panel. ¿Tienes un PDF? Envíanoslo y lo subimos por ti gratis.</p>
            </div>
            <div className="step rv d3" style={{ background: 'white', borderRight: 'none' }}>
              <div className="step-n" style={{ color: 'var(--cream-mid)' }}>03</div>
              <div className="step-ico" style={{ background: 'var(--green-light)', borderColor: 'rgba(26,92,54,0.15)' }}>🎨</div>
              <h3 style={{ color: 'var(--ink)' }}>Personaliza tu carta</h3>
              <p style={{ color: 'var(--ink-50)' }}>Agrega el logo de tu restaurante, los colores de tu marca y organiza las categorías. Tu carta se ve como parte de tu negocio.</p>
            </div>
          </div>
          <div className="steps-wrap" style={{ borderColor: 'var(--border)', background: 'var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginTop: '1px' }}>
            <div className="step rv d1" style={{ background: 'white', borderRightColor: 'var(--border)' }}>
              <div className="step-n" style={{ color: 'var(--cream-mid)' }}>04</div>
              <div className="step-ico" style={{ background: 'var(--wompi-light)', borderColor: 'rgba(95,53,205,0.15)' }}>💳</div>
              <h3 style={{ color: 'var(--ink)' }}>Conecta Wompi</h3>
              <p style={{ color: 'var(--ink-50)' }}>Vincula tu cuenta Wompi en un clic. Tus clientes pueden pagar con tarjeta, PSE o Nequi — el dinero llega directo a tu cuenta bancaria.</p>
            </div>
            <div className="step rv d2" style={{ background: 'white', borderRightColor: 'var(--border)' }}>
              <div className="step-n" style={{ color: 'var(--cream-mid)' }}>05</div>
              <div className="step-ico" style={{ background: 'var(--gold-light)', borderColor: 'rgba(200,137,26,0.15)' }}>📲</div>
              <h3 style={{ color: 'var(--ink)' }}>Comparte el QR o link</h3>
              <p style={{ color: 'var(--ink-50)' }}>Descarga e imprime tu QR personalizado. Ponlo en las mesas, en Instagram, en la bolsa del domicilio. El cliente lo abre sin descargar nada.</p>
            </div>
            <div className="step rv d3" style={{ background: 'white' }}>
              <div className="step-n" style={{ color: 'var(--cream-mid)' }}>06</div>
              <div className="step-ico" style={{ background: 'var(--green-light)', borderColor: 'rgba(26,92,54,0.15)' }}>✅</div>
              <h3 style={{ color: 'var(--ink)' }}>Recibe pedidos ordenados</h3>
              <p style={{ color: 'var(--ink-50)' }}>Cada pedido llega a tu WhatsApp con plato, cantidad y confirmación de pago. Sin errores, sin interpretaciones, sin caos.</p>
            </div>
          </div>
        </section>

        <section className="how-sect">
          <div className="rv">
            <h2 className="sh sh-white">Lo que vive tu cliente<br /><span className="si">en cada pedido.</span></h2>
          </div>
          <div className="steps-wrap" style={{ marginTop: '3rem' }}>
            <div className="step rv d1"><div className="step-n">01</div><div className="step-ico">📷</div><h3>Escanea el QR</h3><p>El cliente escanea el código QR desde la mesa o lo recibe por link. Se abre tu carta directamente en el navegador — sin apps.</p></div>
            <div className="step rv d2"><div className="step-n">02</div><div className="step-ico">👆</div><h3>Elige del menú</h3><p>Navega por las categorías, ve las fotos y precios, y selecciona lo que quiere. Puede agregar instrucciones especiales.</p></div>
            <div className="step rv d3"><div className="step-n">03</div><div className="step-ico">💳</div><h3>Paga con Wompi</h3><p>Elige el método de pago — tarjeta, PSE o Nequi — y paga en segundos. Recibe confirmación de pago al instante.</p></div>
          </div>
        </section>

        <section className="sect" style={{ background: 'white' }}>
          <div className="rv">
            <h2 className="sh">Todo lo que quieres<br /><span className="si">saber.</span></h2>
          </div>
          <div className="faq-wrap">
            <div className="faq-item"><button className="faq-q" onClick={toggleFaq}>¿Necesito saber de tecnología para usar Platorin?<span className="faq-arrow">+</span></button><div className="faq-a"><div className="faq-a-inner">No. Platorin está diseñado para dueños de restaurantes, no para técnicos. Si sabes usar WhatsApp y subir una foto, puedes usar Platorin. Y si en algún momento te trabas, nuestro soporte responde por WhatsApp en minutos.</div></div></div>
            <div className="faq-item"><button className="faq-q" onClick={toggleFaq}>¿Mis clientes tienen que descargar alguna app?<span className="faq-arrow">+</span></button><div className="faq-a"><div className="faq-a-inner">No. Tu carta se abre directamente en el navegador del celular — Chrome, Safari, cualquiera. Sin descargas, sin registros, sin fricción para el cliente.</div></div></div>
            <div className="faq-item"><button className="faq-q" onClick={toggleFaq}>¿Cómo funciona el pago con Wompi?<span className="faq-arrow">+</span></button><div className="faq-a"><div className="faq-a-inner">Wompi es la pasarela de pagos de Bancolombia, regulada y segura. Cuando el cliente hace el pedido, se genera un link de pago de Wompi donde puede pagar con tarjeta débito/crédito, PSE o Nequi. El dinero llega a tu cuenta bancaria en el siguiente día hábil.</div></div></div>
            <div className="faq-item"><button className="faq-q" onClick={toggleFaq}>¿Cuánto cobra Wompi por cada transacción?<span className="faq-arrow">+</span></button><div className="faq-a"><div className="faq-a-inner">Wompi cobra una comisión estándar que varía según el método de pago (aproximadamente 2.9% + $900 COP por transacción). Platorin no agrega ninguna comisión adicional sobre esto. Las tarifas exactas las puedes consultar directamente en wompi.com.</div></div></div>
            <div className="faq-item"><button className="faq-q" onClick={toggleFaq}>¿Puedo seguir recibiendo pedidos por WhatsApp sin pago con Wompi?<span className="faq-arrow">+</span></button><div className="faq-a"><div className="faq-a-inner">Sí. Wompi es opcional. Puedes configurar tu carta para que el pedido llegue a tu WhatsApp y coordinar el pago como prefieras: efectivo, transferencia, lo que funcione para ti.</div></div></div>
            <div className="faq-item"><button className="faq-q" onClick={toggleFaq}>¿Puedo actualizar el menú en tiempo real?<span className="faq-arrow">+</span></button><div className="faq-a"><div className="faq-a-inner">Sí. Puedes marcar platos como "agotado", cambiar precios o agregar nuevos en segundos desde el panel. Los cambios se reflejan inmediatamente en tu carta sin necesidad de reimprimir o redistribuir nada.</div></div></div>
            <div className="faq-item"><button className="faq-q" onClick={toggleFaq}>¿Qué pasa si cancelo mi suscripción?<span className="faq-arrow">+</span></button><div className="faq-a"><div className="faq-a-inner">Puedes cancelar cuando quieras, sin penaltis. Tu carta quedará inactiva pero tus datos se conservan por 30 días si decides volver. No hacemos cobros automáticos sin avisarte.</div></div></div>
          </div>
        </section>

        <section className="cta-sect">
          <h2 className="rv">¿Listo para organizar<br /><span className="si">tus pedidos hoy?</span></h2>
          <p className="rv d1">14 días gratis. Sin tarjeta. Sin compromisos.</p>
          <div className="cta-row rv d2">
            <button className="btn-dark" onClick={() => navigate('/register')}>Empezar gratis →</button>
            <a href="https://wa.me/573001234567" target="_blank" className="btn-wa">Preguntar por WhatsApp</a>
          </div>
        </section>
        <footer>
          <div className="footer-grid">
            <div><div className="footer-logo" onClick={() => goTo('home')}>Plato<b>rin</b></div><p className="footer-desc">Carta digital y pedidos por WhatsApp para restaurantes en toda Colombia.</p></div>
            <div><div className="fc-title">Producto</div><button className="fc-link" onClick={() => goTo('como-funciona')}>Cómo funciona</button><button className="fc-link" onClick={() => goTo('precios')}>Precios</button></div>
            <div><div className="fc-title">Empresa</div><button className="fc-link" onClick={() => goTo('historia')}>Nuestra historia</button><button className="fc-link" onClick={() => goTo('blog')}>Blog</button></div>
            <div><div className="fc-title">Soporte</div><button className="fc-link" onClick={() => goTo('ayuda')}>Centro de ayuda</button><button className="fc-link" onClick={() => goTo('privacidad')}>Privacidad</button></div>
          </div>
          <div className="footer-bottom"><span className="footer-cr">© 2026 Platorin.</span><div className="footer-made">Hecho con <span>♥</span> en Valledupar 🇨🇴</div></div>
        </footer>
      </div>

      {/* PAGE: PRECIOS */}
      <div id="page-precios" className={`page ${activePage === 'precios' ? 'active' : ''}`}>
        <div className="page-hero">
          
          <h2 className="sh">Planes para cada<br /><span className="si">restaurante.</span></h2>
          <p className="ss" style={{ textAlign: 'center', margin: '0 auto' }}>Sin sorpresas. Sin letra pequeña. Cancela cuando quieras.</p>
        </div>

        <section className="price-sect" style={{ paddingTop: '4rem' }}>
          <div className="price-grid">
            <div className="pc2"><div className="pname">Gratis</div><div className="pamt">$0</div><div className="pperiod">Para empezar, sin tarjeta</div><div className="pline"></div><ul className="plist"><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>1 carta digital activa</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Hasta 50 pedidos al mes</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Código QR incluido</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Pedidos por WhatsApp</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Soporte por WhatsApp</li></ul><button className="pbtn pbtn-o" onClick={() => navigate('/register')}>Empezar gratis</button></div>
            <div className="pc2 feat-p"><div className="pb">Más popular</div><div className="pname">Pro</div><div className="pamt">$89<small>.000 COP</small></div><div className="pperiod">por mes · cancela cuando quieras</div><div className="pline"></div><ul className="plist"><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Cartas y pedidos ilimitados</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>QR personalizado con tu logo</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Panel de estadísticas completo</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Cobros con Wompi incluido</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Platos marcados como agotado</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Soporte prioritario 24/7</li></ul><button className="pbtn pbtn-s" onClick={() => navigate('/register')}>Empezar con Pro</button></div>
            <div className="pc2"><div className="pname">Cadena</div><div className="pamt">$189<small>.000 COP</small></div><div className="pperiod">por mes · hasta 5 sedes</div><div className="pline"></div><ul className="plist"><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Todo lo del plan Pro</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Hasta 5 sedes en un panel</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Informes de ventas por sede</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Onboarding personalizado</li><li><div className="pck"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" /></svg></div>Gerente de cuenta dedicado</li></ul><button className="pbtn pbtn-o" onClick={() => goTo('contacto')}>Hablar con ventas</button></div>
          </div>
        </section>

        <section className="sect" style={{ background: 'white' }}>
          <div className="rv">
            <h2 className="sh">¿Qué incluye<br /><span className="si">cada plan?</span></h2>
          </div>
          <div className="compare-wrap rv d1">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Funcionalidad</th>
                  <th>Gratis</th>
                  <th className="feat-col th-feat" style={{ color: 'var(--wa)' }}>Pro</th>
                  <th>Cadena</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Cartas digitales</td><td className="check-cell">1</td><td className="check-cell feat-col" style={{ color: 'white' }}>Ilimitadas</td><td className="check-cell">Ilimitadas</td></tr>
                <tr><td>Pedidos por mes</td><td className="check-cell">50</td><td className="check-cell feat-col" style={{ color: 'white' }}>Ilimitados</td><td className="check-cell">Ilimitados</td></tr>
                <tr><td>Código QR</td><td className="check-cell check-yes">✓</td><td className="check-cell feat-col check-yes">✓</td><td className="check-cell check-yes">✓</td></tr>
                <tr><td>QR con tu logo</td><td className="check-cell check-no">—</td><td className="check-cell feat-col check-yes">✓</td><td className="check-cell check-yes">✓</td></tr>
                <tr><td>Pedidos a WhatsApp</td><td className="check-cell check-yes">✓</td><td className="check-cell feat-col check-yes">✓</td><td className="check-cell check-yes">✓</td></tr>
                <tr><td>Cobros con Wompi</td><td className="check-cell check-no">—</td><td className="check-cell feat-col check-yes">✓</td><td className="check-cell check-yes">✓</td></tr>
                <tr><td>Panel de estadísticas</td><td className="check-cell check-no">—</td><td className="check-cell feat-col check-yes">✓</td><td className="check-cell check-yes">✓</td></tr>
                <tr><td>Platos agotados en tiempo real</td><td className="check-cell check-no">—</td><td className="check-cell feat-col check-yes">✓</td><td className="check-cell check-yes">✓</td></tr>
                <tr><td>Múltiples sedes</td><td className="check-cell check-no">—</td><td className="check-cell feat-col check-no">—</td><td className="check-cell check-yes">Hasta 5</td></tr>
                <tr><td>Informes por sede</td><td className="check-cell check-no">—</td><td className="check-cell feat-col check-no">—</td><td className="check-cell check-yes">✓</td></tr>
                <tr><td>Onboarding personalizado</td><td className="check-cell check-no">—</td><td className="check-cell feat-col check-no">—</td><td className="check-cell check-yes">✓</td></tr>
                <tr><td>Soporte por WhatsApp</td><td className="check-cell check-yes">✓</td><td className="check-cell feat-col" style={{ color: 'var(--wa)' }}>Prioritario</td><td className="check-cell check-yes">Dedicado</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="sect">
          <div className="rv" style={{ textAlign: 'center' }}>
            <h2 className="sh">Preguntas frecuentes<br /><span className="si">sobre los planes.</span></h2>
          </div>
          <div className="faq-wrap">
            <div className="faq-item"><button className="faq-q" onClick={toggleFaq}>¿Puedo cambiar de plan cuando quiera?<span className="faq-arrow">+</span></button><div className="faq-a"><div className="faq-a-inner">Sí. Puedes subir o bajar de plan en cualquier momento desde tu panel. Si subes de plan, el cambio es inmediato. Si bajas, el cambio aplica al inicio del siguiente periodo.</div></div></div>
            <div className="faq-item"><button className="faq-q" onClick={toggleFaq}>¿Los 14 días gratis aplican para todos los planes?<span className="faq-arrow">+</span></button><div className="faq-a"><div className="faq-a-inner">Sí. Los 14 días de prueba gratuita aplican para el plan Pro, con todas las funcionalidades incluidas. No necesitas tarjeta de crédito para activarlos. Al terminar el periodo, decides si continúas o te quedas en el plan Gratis.</div></div></div>
            <div className="faq-item"><button className="faq-q" onClick={toggleFaq}>¿Cómo se cobra el plan? ¿Puedo pagar mensual?<span className="faq-arrow">+</span></button><div className="faq-a"><div className="faq-a-inner">Sí, el cobro es mensual y se hace vía Wompi al inicio de cada periodo. También ofrecemos descuento del 20% si pagas anual. Puedes hablar con nosotros por WhatsApp para coordinar la forma de pago que mejor te funcione.</div></div></div>
            <div className="faq-item"><button className="faq-q" onClick={toggleFaq}>¿Qué pasa con mi cuenta si no pago a tiempo?<span className="faq-arrow">+</span></button><div className="faq-a"><div className="faq-a-inner">Te avisamos 5 días antes del vencimiento y el día del vencimiento. Si no se renueva, tu cuenta pasa automáticamente al plan Gratis — tu carta queda activa pero con las limitaciones del plan gratuito. Tus datos nunca se borran.</div></div></div>
          </div>
        </section>

        <section className="cta-sect">
          <h2 className="rv">Empieza gratis.<br /><span className="si">Sin compromisos.</span></h2>
          <p className="rv d1">14 días con todas las funciones Pro, sin tarjeta de crédito.</p>
          <div className="cta-row rv d2">
            <button className="btn-dark" onClick={() => navigate('/register')}>Activar prueba gratis →</button>
            <a href="https://wa.me/573001234567" target="_blank" className="btn-wa">Preguntar por WhatsApp</a>
          </div>
        </section>
        <footer>
          <div className="footer-grid">
            <div><div className="footer-logo" onClick={() => goTo('home')}>Plato<b>rin</b></div><p className="footer-desc">Carta digital y pedidos por WhatsApp para restaurantes en toda Colombia.</p></div>
            <div><div className="fc-title">Producto</div><button className="fc-link" onClick={() => goTo('como-funciona')}>Cómo funciona</button><button className="fc-link" onClick={() => goTo('precios')}>Precios</button></div>
            <div><div className="fc-title">Empresa</div><button className="fc-link" onClick={() => goTo('historia')}>Nuestra historia</button><button className="fc-link" onClick={() => goTo('blog')}>Blog</button></div>
            <div><div className="fc-title">Soporte</div><button className="fc-link" onClick={() => goTo('ayuda')}>Centro de ayuda</button><button className="fc-link" onClick={() => goTo('privacidad')}>Privacidad</button></div>
          </div>
          <div className="footer-bottom"><span className="footer-cr">© 2026 Platorin.</span><div className="footer-made">Hecho con <span>♥</span> en Valledupar 🇨🇴</div></div>
        </footer>
      </div>

      {/* PAGE: HISTORIA */}
      <div id="page-historia" className={`page ${activePage === 'historia' ? 'active' : ''}`}>
        <div className="page-hero">
          
          <h2 className="sh">Nacimos en <span className="si">Valledupar.</span></h2>
          <p className="ss" style={{ textAlign: 'center', margin: '0 auto' }}>Una herramienta real, construida desde el corazón del Caribe colombiano para restaurantes de todo el país.</p>
        </div>

        <section className="sect">
          <div className="historia-grid">
            <div className="rv">
              
              <h2 className="sh">El problema lo vivimos<br /><span className="si">en carne propia.</span></h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--ink-50)', lineHeight: '1.85', marginBottom: '1rem', fontWeight: '300' }}>Valledupar es una ciudad donde la comida es cultura. Cada restaurante tiene historia, cada cocinera tiene su sazón. Pero cuando el mediodía llegaba, el caos era el mismo en todos: WhatsApp desbordado, pedidos perdidos, errores en cocina.</p>
              <p style={{ fontSize: '0.95rem', color: 'var(--ink-50)', lineHeight: '1.85', marginBottom: '1rem', fontWeight: '300' }}>Vimos dueños de restaurantes que no podían ni almorzar de tanto WhatsApp que tenían que atender. Vimos cocinas que preparaban el plato equivocado porque el mensaje era confuso. Vimos clientes que se iban porque nadie les respondía a tiempo.</p>
              <div className="origin-quote" style={{ margin: '2rem 0' }}>
                <p>El problema no era de tecnología. Era de organización. Y la solución tenía que ser tan simple que cualquier dueño de restaurante pudiera usarla sin ayuda.</p>
                <cite>— Fundadores de Platorin, Valledupar, 2023</cite>
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--ink-50)', lineHeight: '1.85', fontWeight: '300' }}>Platorin nació de esa necesidad real, vivida en el mercado vallenato, probada en los restaurantes de la ciudad amurallada del río Guatapurí. Desde el primer día, la filosofía fue la misma: directo, cálido y sin rodeos — como el costeño que somos.</p>
            </div>
            <div className="rv d2">
              <div className="timeline">
                <div className="tl-item"><div className="tl-dot">23</div><div className="tl-content"><div className="tl-year">2023</div><h4>La idea nace en Valledupar</h4><p>Identificamos el problema de los pedidos caóticos en restaurantes locales y comenzamos a construir la primera versión.</p></div></div>
                <div className="tl-item"><div className="tl-dot">Q1</div><div className="tl-content"><div className="tl-year">2024</div><h4>Primeros restaurantes piloto</h4><p>Lanzamos con 5 restaurantes en Valledupar y Barranquilla. El feedback fue inmediato: "Esto sí funciona".</p></div></div>
                <div className="tl-item"><div className="tl-dot">Q3</div><div className="tl-content"><div className="tl-year">2024</div><h4>Integración con Wompi</h4><p>Agregamos cobros en línea vía Wompi, eliminando la última fricción del proceso de pedido.</p></div></div>
                <div className="tl-item"><div className="tl-dot">Q4</div><div className="tl-content"><div className="tl-year">2024</div><h4>Expansión nacional</h4><p>Llegamos a Bogotá, Medellín, Cali y Montería. Más de 100 restaurantes activos en todo el país.</p></div></div>
                <div className="tl-item"><div className="tl-dot">25</div><div className="tl-content"><div className="tl-year">2025</div><h4>Más de 200 restaurantes</h4><p>Seguimos creciendo desde Valledupar para toda Colombia, con la misma filosofía del primer día.</p></div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="sect" style={{ background: 'white', paddingTop: '5rem' }}>
          <div className="rv" style={{ textAlign: 'center' }}>
            <h2 className="sh">Lo que nos mueve<br /><span className="si">cada día.</span></h2>
          </div>
          <div className="values-grid" style={{ maxWidth: '800px', margin: '3rem auto 0', gridTemplateColumns: 'repeat(2,1fr)' }}>
            <div className="value-card rv d1"><div className="ico">🌿</div><h4>Simplicidad real</h4><p>Construimos para dueños de restaurantes, no para techies. Si algo es complicado, lo rehacemos hasta que sea obvio.</p></div>
            <div className="value-card rv d2"><div className="ico">🤝</div><h4>Calidez costeña</h4><p>El soporte no es un ticket. Es una person real respondiendo por WhatsApp, en minutos, sin scripts corporativos.</p></div>
            <div className="value-card rv d1"><div className="ico">🎯</div><h4>Resultados, no features</h4><p>No agregamos funciones para impresionar. Agregamos lo que ayuda a vender más y a perder menos pedidos.</p></div>
            <div className="value-card rv d2"><div className="ico">🇨🇴</div><h4>Hecho para Colombia</h4><p>Sabemos cómo funciona el negocio de la comida en Colombia porque somos de aquí. Eso no se improvisa.</p></div>
          </div>
        </section>

        <section className="cta-sect">
          <h2 className="rv">Únete a los +200 restaurantes<br /><span className="si">que ya cambiaron.</span></h2>
          <p className="rv d1">14 días gratis. Sin tarjeta. Sin compromisos.</p>
          <div className="cta-row rv d2">
            <button className="btn-dark" onClick={() => navigate('/register')}>Empezar gratis →</button>
            <a href="https://wa.me/573001234567" target="_blank" className="btn-wa">Hablar con el equipo</a>
          </div>
        </section>
        <footer>
          <div className="footer-grid">
            <div><div className="footer-logo" onClick={() => goTo('home')}>Plato<b>rin</b></div><p className="footer-desc">Carta digital y pedidos por WhatsApp para restaurantes en toda Colombia.</p></div>
            <div><div className="fc-title">Producto</div><button className="fc-link" onClick={() => goTo('como-funciona')}>Cómo funciona</button><button className="fc-link" onClick={() => goTo('precios')}>Precios</button></div>
            <div><div className="fc-title">Empresa</div><button className="fc-link" onClick={() => goTo('historia')}>Nuestra historia</button><button className="fc-link" onClick={() => goTo('blog')}>Blog</button></div>
            <div><div className="fc-title">Soporte</div><button className="fc-link" onClick={() => goTo('ayuda')}>Centro de ayuda</button><button className="fc-link" onClick={() => goTo('privacidad')}>Privacidad</button></div>
          </div>
          <div className="footer-bottom"><span className="footer-cr">© 2026 Platorin.</span><div className="footer-made">Hecho con <span>♥</span> en Valledupar 🇨🇴</div></div>
        </footer>
      </div>

      {/* PAGE: CONTACTO */}
      <div id="page-contacto" className={`page ${activePage === 'contacto' ? 'active' : ''}`}>
        <div className="page-hero">
          
          <h2 className="sh">Hablemos.<br /><span className="si">Sin formularios eternos.</span></h2>
          <p className="ss" style={{ textAlign: 'center', margin: '0 auto' }}>La forma más rápida de empezar es por WhatsApp. Respondemos en minutos.</p>
        </div>

        <section className="sect">
          <div className="contact-grid">
            <div>
              <div className="contact-option" style={{ borderTop: '3px solid var(--wa)' }}>
                <div className="ico">💬</div>
                <h3>WhatsApp — La más rápida</h3>
                <p>Escríbenos directamente. Un miembro del equipo te responde en minutos, no en días. Sin bots, sin scripts.</p>
                <a href="https://wa.me/573001234567?text=Hola%2C%20quiero%20empezar%20con%20Platorin%20para%20mi%20restaurante" target="_blank" className="btn-wa" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a8.26 8.26 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.112 1.523 5.835L0 24l6.341-1.5A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.813 9.813 0 01-4.984-1.361l-.357-.212-3.766.889.929-3.657-.232-.375A9.818 9.818 0 012.182 12C2.182 6.568 6.568 2.182 12 2.182S21.818 6.568 21.818 12 17.432 21.818 12 21.818z" /></svg>
                  Escribir por WhatsApp
                </a>
                <p style={{ fontSize: '0.75rem', color: 'var(--ink-30)', marginTop: '0.75rem', marginBottom: '0' }}>Lunes a sábado · 8am – 8pm</p>
              </div>
            </div>
            <div>
              <div className="contact-option" style={{ borderTop: '3px solid var(--green)' }}>
                {!formSuccess ? (
                  <>
                    <div className="ico">📋</div>
                    <h3>Cuéntanos sobre tu restaurante</h3>
                    <p>Déjanos tus datos y te contactamos para hacer el onboarding personalizado.</p>
                    <div className="contact-form" id="contact-form">
                      <div className="form-field"><label className="form-label">Nombre del restaurante</label><input className="form-input" type="text" placeholder="Ej: Donde Juancho" id="f-nombre" /></div>
                      <div className="form-field"><label className="form-label">Tu nombre</label><input className="form-input" type="text" placeholder="Ej: Juancho Romero" id="f-contacto" /></div>
                      <div className="form-field"><label className="form-label">Ciudad</label><input className="form-input" type="text" placeholder="Ej: Valledupar, Cesar" id="f-ciudad" /></div>
                      <div className="form-field"><label className="form-label">Plan de interés</label>
                        <select className="form-select" id="f-plan">
                          <option value="">Selecciona un plan</option>
                          <option value="gratis">Gratis — Empezar a probar</option>
                          <option value="pro">Pro — $89.000/mes</option>
                          <option value="cadena">Cadena — $189.000/mes</option>
                          <option value="no-se">No sé todavía, necesito asesoría</option>
                        </select>
                      </div>
                      <div className="form-field"><label className="form-label">¿Algo más que quieras contarnos?</label><textarea className="form-textarea" placeholder="Cuéntanos sobre tu restaurante, cuántos pedidos recibes por WhatsApp al día, etc." id="f-mensaje"></textarea></div>
                      <button className="btn-filled" style={{ width: '100%', justifyContent: 'center' }} onClick={submitForm}>Enviar y empezar →</button>
                    </div>
                  </>
                ) : (
                  <div id="form-success" style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</div>
                    <h3 style={{ marginBottom: '0.5rem' }}>¡Listo! Te contactamos pronto.</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--ink-50)' }}>En las próximas horas recibirás un WhatsApp de nuestro equipo para hacer el onboarding.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <footer>
          <div className="footer-grid">
            <div><div className="footer-logo" onClick={() => goTo('home')}>Plato<b>rin</b></div><p className="footer-desc">Carta digital y pedidos por WhatsApp para restaurantes en toda Colombia.</p></div>
            <div><div className="fc-title">Producto</div><button className="fc-link" onClick={() => goTo('como-funciona')}>Cómo funciona</button><button className="fc-link" onClick={() => goTo('precios')}>Precios</button></div>
            <div><div className="fc-title">Empresa</div><button className="fc-link" onClick={() => goTo('historia')}>Nuestra historia</button><button className="fc-link" onClick={() => goTo('blog')}>Blog</button></div>
            <div><div className="fc-title">Soporte</div><button className="fc-link" onClick={() => goTo('ayuda')}>Centro de ayuda</button><button className="fc-link" onClick={() => goTo('privacidad')}>Privacidad</button></div>
          </div>
          <div className="footer-bottom"><span className="footer-cr">© 2026 Platorin.</span><div className="footer-made">Hecho con <span>♥</span> en Valledupar 🇨🇴</div></div>
        </footer>
      </div>

      {/* PAGE: AYUDA */}
      <div id="page-ayuda" className={`page ${activePage === 'ayuda' ? 'active' : ''}`}>
        <div className="page-hero">
          
          <h2 className="sh">¿En qué podemos<br /><span className="si">ayudarte?</span></h2>
          <p className="ss" style={{ textAlign: 'center', margin: '0 auto' }}>Encuentra respuestas rápidas o escríbenos directamente por WhatsApp.</p>
        </div>

        <section className="sect">
          <div className="rv" style={{ textAlign: 'center' }}><h2 className="sh">Temas <span className="si">frecuentes.</span></h2></div>
          <div className="ayuda-grid">
            <div className="ayuda-card rv d1" onClick={() => goTo('como-funciona')}><div className="ico">🚀</div><h3>Primeros pasos</h3><p>Cómo crear tu cuenta, subir tu menú y compartir el QR con tus clientes.</p></div>
            <div className="ayuda-card rv d2"><div className="ico">💳</div><h3>Pagos con Wompi</h3><p>Cómo conectar Wompi, métodos de pago disponibles y cómo recibes el dinero.</p></div>
            <div className="ayuda-card rv d3"><div className="ico">📱</div><h3>Tu carta digital</h3><p>Cómo agregar, editar y organizar los platos. Fotos, categorías y precios.</p></div>
            <div className="ayuda-card rv d1"><div className="ico">📊</div><h3>Panel de ventas</h3><p>Cómo interpretar las estadísticas, exportar reportes y ver el historial de pedidos.</p></div>
            <div className="ayuda-card rv d2"><div className="ico">💬</div><h3>WhatsApp y pedidos</h3><p>Cómo llegan los pedidos, cómo configurar tu número y gestionar las notificaciones.</p></div>
            <div className="ayuda-card rv d3"><div className="ico">💰</div><h3>Planes y facturación</h3><p>Cambiar de plan, fechas de cobro, facturas y cómo cancelar si necesitas.</p></div>
          </div>
        </section>

        <section className="sect" style={{ background: 'white', paddingTop: 0 }}>
          <div className="rv"><h2 className="sh">Las preguntas que más<br /><span className="si">nos hacen.</span></h2></div>
          <div className="faq-wrap">
            <div className="faq-item"><button className="faq-q" onClick={toggleFaq}>¿Cómo actualizo un precio en el menú?<span className="faq-arrow">+</span></button><div className="faq-a"><div className="faq-a-inner">Entra a tu panel, selecciona el plato que quieres editar, cambia el precio y guarda. El cambio se refleja en tu carta en tiempo real, sin necesidad de reimprimir nada.</div></div></div>
            <div className="faq-item"><button className="faq-q" onClick={toggleFaq}>¿Cómo marco un plato como agotado?<span className="faq-arrow">+</span></button><div className="faq-a"><div className="faq-a-inner">En tu panel, al lado de cada plato hay un botón de "disponible/agotado". Al marcarlo, el plato aparece con un aviso de agotado en tu carta y el cliente no puede agregarlo al pedido. Disponible en plan Pro en adelante.</div></div></div>
            <div className="faq-item"><button className="faq-q" onClick={toggleFaq}>¿Cómo llega el pedido a mi WhatsApp?<span className="faq-arrow">+</span></button><div className="faq-a"><div className="faq-a-inner">Cuando el cliente completa su pedido, Platorin genera automáticamente un mensaje con todos los detalles (platos, cantidades, datos del cliente y confirmación de pago) y lo envía a tu número de WhatsApp configurado. Solo tienes que leerlo y preparar el pedido.</div></div></div>
            <div className="faq-item"><button className="faq-q" onClick={toggleFaq}>No recibo los pedidos en WhatsApp, ¿qué hago?<span className="faq-arrow">+</span></button><div className="faq-a"><div className="faq-a-inner">Primero verifica que el número de WhatsApp en tu panel sea el correcto. Si está correcto, escríbenos por WhatsApp al +57 300 123 4567 y lo resolvemos en minutos. El equipo de soporte está disponible de lunes a sábado de 8am a 8pm.</div></div></div>
            <div className="faq-item"><button className="faq-q" onClick={toggleFaq}>¿Cómo activo mi cuenta de Wompi?<span className="faq-arrow">+</span></button><div className="faq-a"><div className="faq-a-inner">En tu panel, ve a "Pagos" y selecciona "Conectar Wompi". Te redirigimos a Wompi donde creas tu cuenta (necesitas RUT o NIT, cuenta bancaria colombiana y tu número de celular). Una vez aprobada la cuenta de Wompi (puede tomar 1-2 días hábiles), los cobros se activan automáticamente.</div></div></div>
          </div>
        </section>

        <section className="cta-sect">
          <h2 className="rv">¿No encontraste<br /><span className="si">lo que buscabas?</span></h2>
          <p className="rv d1">Escríbenos directamente. Respondemos en minutos.</p>
          <div className="cta-row rv d2">
            <a href="https://wa.me/573001234567?text=Hola%2C%20tengo%20una%20pregunta%20sobre%20Platorin" target="_blank" className="btn-wa">Preguntar por WhatsApp</a>
          </div>
        </section>
        <footer>
          <div className="footer-grid">
            <div><div className="footer-logo" onClick={() => goTo('home')}>Plato<b>rin</b></div><p className="footer-desc">Carta digital y pedidos por WhatsApp para restaurantes en toda Colombia.</p></div>
            <div><div className="fc-title">Producto</div><button className="fc-link" onClick={() => goTo('como-funciona')}>Cómo funciona</button><button className="fc-link" onClick={() => goTo('precios')}>Precios</button></div>
            <div><div className="fc-title">Empresa</div><button className="fc-link" onClick={() => goTo('historia')}>Nuestra historia</button><button className="fc-link" onClick={() => goTo('blog')}>Blog</button></div>
            <div><div className="fc-title">Soporte</div><button className="fc-link" onClick={() => goTo('ayuda')}>Centro de ayuda</button><button className="fc-link" onClick={() => goTo('privacidad')}>Privacidad</button></div>
          </div>
          <div className="footer-bottom"><span className="footer-cr">© 2026 Platorin.</span><div className="footer-made">Hecho con <span>♥</span> en Valledupar 🇨🇴</div></div>
        </footer>
      </div>

      {/* PAGE: BLOG */}
      <div id="page-blog" className={`page ${activePage === 'blog' ? 'active' : ''}`}>
        <div className="page-hero">
          
          <h2 className="sh">Ideas para vender<br /><span className="si">más en tu restaurante.</span></h2>
          <p className="ss" style={{ textAlign: 'center', margin: '0 auto' }}>Consejos prácticos de gastronomía, tecnología y negocios para restaurantes colombianos.</p>
        </div>
        <section className="sect">
          <div className="blog-grid">
            <div className="blog-card rv d1"><div className="blog-thumb" style={{ background: 'var(--green-light)' }}>🍽️</div><div className="blog-body"><div className="blog-tag">Operaciones</div><div className="blog-title">5 errores que cometen los restaurantes al tomar pedidos por WhatsApp</div><p className="blog-excerpt">El WhatsApp es la herramienta de pedidos más usada en Colombia, pero sin un sistema claro puede costarte más de lo que crees.</p><div className="blog-meta">15 mayo 2025 · 5 min lectura</div></div></div>
            <div className="blog-card rv d2"><div className="blog-thumb" style={{ background: 'var(--wompi-light)' }}>💳</div><div className="blog-body"><div className="blog-tag">Pagos digitales</div><div className="blog-title">Wompi para restaurantes: cómo cobrar en línea sin complicaciones</div><p className="blog-excerpt">Todo lo que necesitas saber sobre cómo implementar pagos digitales en tu restaurante sin necesitar un técnico.</p><div className="blog-meta">8 mayo 2025 · 7 min lectura</div></div></div>
            <div className="blog-card rv d3"><div className="blog-thumb" style={{ background: 'var(--gold-light)' }}>📸</div><div className="blog-body"><div className="blog-tag">Marketing</div><div className="blog-title">Por qué las fotos en tu menú digital pueden aumentar tus ventas un 40%</div><p className="blog-excerpt">La psicología detrás de las decisiones de compra de comida y cómo usar las fotos para impulsar tus platos más rentables.</p><div className="blog-meta">1 mayo 2025 · 6 min lectura</div></div></div>
            <div className="blog-card rv d1"><div className="blog-thumb" style={{ background: 'var(--cream-deep)' }}>🪗</div><div className="blog-body"><div className="blog-tag">Historias</div><div className="blog-title">Cómo "Donde Juancho" triplicó sus pedidos de domicilio en 2 semanas</div><p className="blog-excerpt">El restaurante vallenato que pasó de perder pedidos por WhatsApp a tener el proceso más organizado del barrio.</p><div className="blog-meta">22 abril 2025 · 4 min lectura</div></div></div>
            <div className="blog-card rv d2"><div className="blog-thumb" style={{ background: 'var(--green-light)' }}>📊</div><div className="blog-body"><div className="blog-tag">Negocios</div><div className="blog-title">Métricas que todo dueño de restaurante debería monitorear cada día</div><p className="blog-excerpt">De ticket promedio a tasa de pedidos repetidos — los números que te dicen si tu negocio va bien o necesita ajustes.</p><div className="blog-meta">14 abril 2025 · 8 min lectura</div></div></div>
            <div className="blog-card rv d3"><div className="blog-thumb" style={{ background: 'var(--wompi-light)' }}>🚀</div><div className="blog-body"><div className="blog-tag">Guías</div><div className="blog-title">Cómo lanzar domicilios en tu restaurante desde cero en una semana</div><p className="blog-excerpt">Guía paso a paso para restaurantes que quieren arrancar el canal de domicilios sin inversión en infraestructura.</p><div className="blog-meta">5 abril 2025 · 10 min lectura</div></div></div>
          </div>
        </section>
        <section className="cta-sect">
          <h2 className="rv">¿Listo para organizar<br /><span className="si">tu restaurante?</span></h2>
          <p className="rv d1">14 días gratis. Sin tarjeta. Sin compromisos.</p>
          <div className="cta-row rv d2"><button className="btn-dark" onClick={() => goTo('contacto')}>Empezar gratis →</button></div>
        </section>
        <footer>
          <div className="footer-grid">
            <div><div className="footer-logo" onClick={() => goTo('home')}>Plato<b>rin</b></div><p className="footer-desc">Carta digital y pedidos por WhatsApp para restaurantes en toda Colombia.</p></div>
            <div><div className="fc-title">Producto</div><button className="fc-link" onClick={() => goTo('como-funciona')}>Cómo funciona</button><button className="fc-link" onClick={() => goTo('precios')}>Precios</button></div>
            <div><div className="fc-title">Empresa</div><button className="fc-link" onClick={() => goTo('historia')}>Nuestra historia</button><button className="fc-link" onClick={() => goTo('blog')}>Blog</button></div>
            <div><div className="fc-title">Soporte</div><button className="fc-link" onClick={() => goTo('ayuda')}>Centro de ayuda</button><button className="fc-link" onClick={() => goTo('privacidad')}>Privacidad</button></div>
          </div>
          <div className="footer-bottom"><span className="footer-cr">© 2026 Platorin.</span><div className="footer-made">Hecho con <span>♥</span> en Valledupar 🇨🇴</div></div>
        </footer>
      </div>

      {/* PAGE: PRIVACIDAD */}
      <div id="page-privacidad" className={`page ${activePage === 'privacidad' ? 'active' : ''}`}>
        <div className="page-hero">
          
          <h2 className="sh">Política de <span className="si">Privacidad</span></h2>
          <p className="ss" style={{ textAlign: 'center', margin: '0 auto' }}>Última actualización: mayo 2025</p>
        </div>
        <section className="sect" style={{ background: 'white' }}>
          <div className="legal-body">
            <h3>1. Quiénes somos</h3>
            <p>Platorin es una plataforma SaaS para restaurantes, operada desde Valledupar, Cesar, Colombia. Nos puedes contactar en cualquier momento a través de WhatsApp o por correo electrónico.</p>
            <h3>2. Información que recopilamos</h3>
            <p>Recopilamos la siguiente información para operar el servicio:</p>
            <ul>
              <li>Datos del restaurante: nombre, dirección, número de WhatsApp, logo.</li>
              <li>Datos del propietario: nombre, correo electrónico, número de celular.</li>
              <li>Datos de uso: pedidos recibidos, platos más vendidos, estadísticas de carta.</li>
              <li>Datos de pago: procesados directamente por Wompi. Platorin no almacena datos de tarjetas.</li>
            </ul>
            <h3>3. Cómo usamos tu información</h3>
            <p>Usamos tu información exclusivamente para:</p>
            <ul>
              <li>Operar y mejorar el servicio de Platorin.</li>
              <li>Enviarte notificaciones de pedidos y actualizaciones del servicio.</li>
              <li>Brindarte soporte técnico y atención al cliente.</li>
              <li>Generar estadísticas y reportes de ventas para tu restaurante.</li>
            </ul>
            <h3>4. Compartir información con terceros</h3>
            <p>No vendemos, arrendamos ni compartimos tu información personal con terceros, excepto:</p>
            <ul>
              <li><strong>Wompi:</strong> Para procesar pagos de manera segura.</li>
              <li><strong>WhatsApp Business API:</strong> Para enviar notificaciones de pedidos.</li>
              <li>Autoridades competentes cuando sea requerido por ley colombiana.</li>
            </ul>
            <h3>5. Seguridad de los datos</h3>
            <p>Implementamos medidas técnicas y organizativas para proteger tu información, incluyendo cifrado en tránsito (HTTPS) y en reposo, y acceso restringido a los datos por parte de nuestro equipo.</p>
            <h3>6. Tus derechos (Ley 1581 de 2012)</h3>
            <p>Como titular de datos personales en Colombia, tienes derecho a conocer, actualizar, rectificar y suprimir tu información. Para ejercer estos derechos, contáctanos por WhatsApp o correo electrónico.</p>
            <h3>7. Retención de datos</h3>
            <p>Conservamos tus datos mientras mantengas una cuenta activa en Platorin. Si cancelas tu cuenta, tus datos se eliminan en un plazo máximo de 90 días calendario, excepto cuando la ley colombiana requiera un periodo de retención mayor.</p>
            <h3>8. Cambios a esta política</h3>
            <p>Podemos actualizar esta política ocasionalmente. Te notificaremos por WhatsApp o correo electrónico ante cambios significativos. El uso continuo del servicio después de la notificación implica tu aceptación de la política actualizada.</p>
            <h3>9. Contacto</h3>
            <p>Para preguntas sobre esta política de privacidad, escríbenos por WhatsApp al +57 300 123 4567 o a nuestro correo electrónico. Respondemos en un plazo máximo de 5 días hábiles.</p>
          </div>
        </section>
        <footer>
          <div className="footer-grid">
            <div><div className="footer-logo" onClick={() => goTo('home')}>Plato<b>rin</b></div><p className="footer-desc">Carta digital y pedidos por WhatsApp para restaurantes en toda Colombia.</p></div>
            <div><div className="fc-title">Producto</div><button className="fc-link" onClick={() => goTo('como-funciona')}>Cómo funciona</button><button className="fc-link" onClick={() => goTo('precios')}>Precios</button></div>
            <div><div className="fc-title">Empresa</div><button className="fc-link" onClick={() => goTo('historia')}>Nuestra historia</button><button className="fc-link" onClick={() => goTo('blog')}>Blog</button></div>
            <div><div className="fc-title">Soporte</div><button className="fc-link" onClick={() => goTo('ayuda')}>Centro de ayuda</button><button className="fc-link" onClick={() => goTo('privacidad')}>Privacidad</button></div>
          </div>
          <div className="footer-bottom"><span className="footer-cr">© 2026 Platorin.</span><div className="footer-made">Hecho con <span>♥</span> en Valledupar 🇨🇴</div></div>
        </footer>
      </div>
    </div>
  );
};
