import React, { useEffect, useRef, useState } from 'react';
import './MacbookHero.css';

const MacbookHero = () => {
  const containerRef = useRef(null);
  const lidRef = useRef(null);
  const screenContentRef = useRef(null);
  const [activeWindow, setActiveWindow] = useState(null);
  const [zIndex, setZIndex] = useState(100);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Dynamic Content States
  const [revenue, setRevenue] = useState(128450);
  const [orders, setOrders] = useState([
    { id: 991, item: 'Sushi Pack', status: 'green' },
    { id: 992, item: 'Double Burger', status: 'yellow' }
  ]);

  // Parallax and Glare effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * -20;
      containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
      const glareX = (e.clientX / window.innerWidth) * 100;
      const glareY = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--glare-x', `${glareX}%`);
      document.documentElement.style.setProperty('--glare-y', `${glareY}%`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Scroll effect for lid
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = window.scrollY / scrollHeight;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dynamic Activity: Revenue & Orders
  useEffect(() => {
    // Animate Revenue
    const revInterval = setInterval(() => {
      setRevenue(prev => prev + Math.floor(Math.random() * 500));
    }, 2500);

    // New Orders
    const fakeOrders = [
      'Crispy Pizza', 'Vanilla Latte', 'Garden Salad', 'Pesto Pasta', 'Iced Tea'
    ];
    let orderIndex = 0;
    const orderInterval = setInterval(() => {
      setOrders(prev => {
        const newOrder = {
          id: 993 + orderIndex,
          item: fakeOrders[orderIndex % fakeOrders.length],
          status: Math.random() > 0.5 ? 'green' : 'yellow'
        };
        orderIndex++;
        const nextOrders = [newOrder, ...prev];
        return nextOrders.slice(0, 3); // Keep only latest 3
      });
    }, 4000);

    return () => {
      clearInterval(revInterval);
      clearInterval(orderInterval);
    };
  }, []);

  // Drag and Drop logic
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
      x = Math.max(0, Math.min(x, screenRect.width - activeWindow.element.offsetWidth));
      y = Math.max(0, Math.min(y, screenRect.height - activeWindow.element.offsetHeight));
      activeWindow.element.style.left = `${x}px`;
      activeWindow.element.style.top = `${y}px`;
      activeWindow.element.style.transition = 'none';
    };
    const handleMouseUp = () => {
      if (activeWindow) {
        activeWindow.element.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        setActiveWindow(null);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeWindow, zIndex]);

  const lidRotation = -scrollProgress * 110;

  return (
    <div className="macbook-hero-wrapper">
      <div className="macbook-container" ref={containerRef}>
        <div className="macbook-lid" ref={lidRef} style={{ transform: `rotateX(${lidRotation}deg)` }}>
          <div className="macbook-screen">
            <div className="screen-content" ref={screenContentRef}>
              <div className="macbook-notch"></div>
              <div className="screen-glare"></div>

              {/* Window: Analytics */}
              <div className="workspace-window" style={{ top: '8%', left: '10%', width: '280px' }}>
                <div className="window-header" onMouseDown={(e) => handleMouseDown(e, 'rev')}>
                  <div className="window-dot dot-red"></div>
                  <div className="window-dot dot-yellow"></div>
                  <div className="window-dot dot-green"></div>
                  <span className="window-title">Realtime ROI</span>
                </div>
                <div className="window-content">
                  <div className="metric-card">
                    <span className="metric-label">Revenue Master</span>
                    <span className="metric-value">${revenue.toLocaleString()}</span>
                    <div className="chart-container">
                      <div className="chart-bar" style={{ height: '40%' }}></div>
                      <div className="chart-bar" style={{ height: '75%' }}></div>
                      <div className="chart-bar" style={{ height: '55%' }}></div>
                      <div className="chart-bar" style={{ height: '90%' }}></div>
                      <div className="chart-bar" style={{ height: '65%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Window: Live Operations */}
              <div className="workspace-window" style={{ top: '42%', left: '42%', width: '250px' }}>
                <div className="window-header" onMouseDown={(e) => handleMouseDown(e, 'ops')}>
                  <div className="window-dot dot-red"></div>
                  <div className="window-dot dot-yellow"></div>
                  <div className="window-dot dot-green"></div>
                  <span className="window-title">Incoming Ops</span>
                </div>
                <div className="window-content">
                   <div className="orders-list">
                     {orders.map(order => (
                       <div key={order.id} className="order-item">
                         <div className={`order-dot ${order.status}`}></div>
                         <span>#ORD-{order.id} • {order.item}</span>
                       </div>
                     ))}
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
