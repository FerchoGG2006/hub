import React, { useEffect, useRef, useState } from 'react';
import './MacbookHero.css';

const MacbookHero = () => {
  const containerRef = useRef(null);
  const screenContentRef = useRef(null);
  const [activeWindow, setActiveWindow] = useState(null);
  const [zIndex, setZIndex] = useState(100);

  // Dynamic Content States
  const [revenue, setRevenue] = useState(12917);
  const [activeTables, setActiveTables] = useState(12);

  // Parallax subtle + Glare tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 12;
      const y = (e.clientY / window.innerHeight - 0.5) * -12;
      containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
      
      const glareX = (e.clientX / window.innerWidth) * 100;
      const glareY = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--glare-x', `${glareX}%`);
      document.documentElement.style.setProperty('--glare-y', `${glareY}%`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Aggressive Cinematic Counters (More visible activity)
  useEffect(() => {
    const revInterval = setInterval(() => {
      setRevenue(prev => prev + Math.floor(Math.random() * 85));
    }, 1500); // Más rápido
    
    const tableInterval = setInterval(() => {
      setActiveTables(prev => {
        const next = prev + (Math.random() > 0.6 ? 1 : -1);
        return Math.max(8, Math.min(next, 15));
      });
    }, 3000);

    return () => {
      clearInterval(revInterval);
      clearInterval(tableInterval);
    };
  }, []);

  // Drag and Drop
  const handleMouseDown = (e, id) => {
    const win = e.currentTarget.parentElement;
    setActiveWindow({
      id,
      element: win,
      offsetX: e.clientX - win.getBoundingClientRect().left,
      offsetY: e.clientY - win.getBoundingClientRect().top
    });
    setZIndex(prev => prev + 1);
    win.style.zIndex = zIndex + 1;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!activeWindow || !screenContentRef.current) return;
      const screenRect = screenContentRef.current.getBoundingClientRect();
      let x = e.clientX - screenRect.left - activeWindow.offsetX;
      let y = e.clientY - screenRect.top - activeWindow.offsetY;
      x = Math.max(-50, Math.min(x, screenRect.width - 50));
      y = Math.max(-50, Math.min(y, screenRect.height - 50));
      activeWindow.element.style.left = `${x}px`;
      activeWindow.element.style.top = `${y}px`;
      activeWindow.element.style.transition = 'none';
    };
    const handleMouseUp = () => setActiveWindow(null);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeWindow, zIndex]);

  return (
    <div className="macbook-hero-wrapper">
      <div className="macbook-container" ref={containerRef}>
        <div className="macbook-lid">
          <div className="macbook-screen">
            <div className="screen-content" ref={screenContentRef}>
              <div className="macbook-notch"></div>
              <div className="screen-glare"></div>

              {/* HUB CORE PANEL - HIGH GLOW VERSION */}
              <div className="workspace-window" style={{ top: '6%', left: '8%', width: '85%', height: '80%', zIndex: 10 }}>
                <div className="window-header" onMouseDown={(e) => handleMouseDown(e, 'hub-panel')}>
                  <div className="window-dot" style={{background: '#ff5f56', boxShadow: '0 0 5px #ff5f56'}}></div>
                  <div className="window-dot" style={{background: '#ffbd2e'}}></div>
                  <div className="window-dot" style={{background: '#27c93f', boxShadow: '0 0 5px #27c93f'}}></div>
                  <span style={{marginLeft: 'auto', fontSize: '9px', fontWeight: 'bold', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '2px'}}>SYSTEM STATUS: OPTIMAL</span>
                </div>
                <div className="window-content" style={{height: 'calc(100% - 30px)', background: 'transparent', display: 'flex'}}>
                   {/* Sidebar Sidebar */}
                   <div style={{width: '60px', background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px', gap: '24px'}}>
                      <div style={{width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #0071e3, #00c6ff)', boxShadow: '0 0 15px rgba(0,113,227,0.5)', cursor: 'pointer'}}></div>
                      <div style={{width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)'}}></div>
                      <div style={{width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)'}}></div>
                   </div>
                   {/* Main Dashboard Area */}
                   <div style={{flex: 1, padding: '30px', color: '#fff'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px'}}>
                        <h4 style={{fontSize: '22px', fontWeight: '900', letterSpacing: '-0.04em', background: 'linear-gradient(to bottom, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>HUB Core Dashboard</h4>
                        <div style={{background: 'rgba(0,113,227,0.1)', border: '1px solid rgba(0,113,227,0.3)', padding: '5px 12px', borderRadius: '20px', fontSize: '9px', color: '#00c6ff', fontWeight: 'bold', letterSpacing: '1px', animation: 'pulse 2s infinite'}}>NODE_ACTIVE_01</div>
                      </div>
                      
                      <div style={{gridTemplateColumns: 'repeat(2, 1fr)', display: 'grid', gap: '20px'}}>
                        <div style={{background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative'}}>
                           <p style={{fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px'}}>Revenue / Live</p>
                           <p style={{fontSize: '28px', fontWeight: '900', marginTop: '8px', color: '#fff'}}>${revenue.toLocaleString()}.00</p>
                           <div style={{position: 'absolute', bottom: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,113,227,0.5), transparent)'}}></div>
                        </div>
                        <div style={{background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)'}}>
                           <p style={{fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px'}}>Active Tables</p>
                           <p style={{fontSize: '28px', fontWeight: '900', color: '#27c93f', marginTop: '8px'}}>{activeTables} <span style={{fontSize: '14px', color: 'rgba(255,255,255,0.1)'}}>/ 15</span></p>
                        </div>
                      </div>

                      <div style={{marginTop: '25px', background: 'rgba(0,113,227,0.03)', borderRadius: '16px', padding: '18px', border: '1px solid rgba(0,113,227,0.2)', position: 'relative', overflow: 'hidden'}}>
                        <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.02), transparent)', animation: 'shimmer 5s infinite'}}></div>
                        <p style={{fontSize: '10px', fontWeight: 'bold', color: '#00c6ff', letterSpacing: '1px'}}>PREDICTIVE ANALYSIS ✨</p>
                        <p style={{fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '8px', lineHeight: '1.6'}}>System optimized. Increasing throughput for <b>Burguer Master</b> based on traffic spikes. ⚡</p>
                      </div>
                   </div>
                </div>
              </div>

              {/* CHAT WINDOW - COMPACT GLOW */}
              <div className="workspace-window" style={{ bottom: '15%', right: '5%', width: '250px', zIndex: 50, animationDelay: '-2s' }}>
                <div className="window-header" onMouseDown={(e) => handleMouseDown(e, 'chat')}>
                   <div style={{width: '32px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)'}}></div>
                </div>
                <div className="window-content" style={{padding: '12px'}}>
                   <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                      <div style={{background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', padding: '10px 14px', borderRadius: '14px 14px 14px 2px', fontSize: '10px', alignSelf: 'flex-start', border: '1px solid rgba(255,255,255,0.05)'}}>
                        Hola! Mesa para 4?
                      </div>
                      <div style={{background: '#0071e3', color: '#fff', padding: '10px 14px', borderRadius: '14px 14px 2px 14px', fontSize: '10px', alignSelf: 'flex-end', boxShadow: '0 5px 20px rgba(0,113,227,0.4)'}}>
                        ¡Listo! Mesa confirmada. ✨
                      </div>
                   </div>
                </div>
              </div>

            </div>
          </div>
        </div>
        <div className="macbook-base"></div>
      </div>
    </div>
  );
};

export default MacbookHero;
