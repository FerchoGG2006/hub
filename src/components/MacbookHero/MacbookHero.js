/* MacbookHero.js */
class MacbookHero {
  constructor() {
    this.container = document.querySelector('.macbook-container');
    this.lid = document.querySelector('.macbook-lid');
    this.windows = document.querySelectorAll('.workspace-window');
    this.glare = document.querySelector('.screen-glare');
    
    this.mouseX = 0;
    this.mouseY = 0;
    this.scrollProgress = 0;
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.initDragAndDrop();
    this.animateNumbers();
    this.updateLoop();
  }

  bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth) - 0.5;
      this.mouseY = (e.clientY / window.innerHeight) - 0.5;
      
      // Update glare position
      const glareX = (e.clientX / window.innerWidth) * 100;
      const glareY = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--glare-x', `${glareX}%`);
      document.documentElement.style.setProperty('--glare-y', `${glareY}%`);
    });

    window.addEventListener('scroll', () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      this.scrollProgress = window.scrollY / scrollHeight;
    });
  }

  updateLoop() {
    // Parallax logic
    const targetRotateY = this.mouseX * 20; // Max 10 deg rotation
    const targetRotateX = -this.mouseY * 20;
    
    // Smooth transition
    this.currentRotateY = this.currentRotateY || 0;
    this.currentRotateX = this.currentRotateX || 0;
    
    this.currentRotateY += (targetRotateY - this.currentRotateY) * 0.1;
    this.currentRotateX += (targetRotateX - this.currentRotateX) * 0.1;

    // Lid Rotation based on scroll (MacBook opening/closing)
    // 0 scroll = 0 rotation (open)
    // 1 scroll = -90 rotation (closed)
    const lidRotation = -this.scrollProgress * 100;
    const scale = 1 - (this.scrollProgress * 0.2);

    this.container.style.transform = `
      rotateY(${this.currentRotateY}deg) 
      rotateX(${this.currentRotateX}deg)
      scale(${scale})
    `;
    
    this.lid.style.transform = `rotateX(${lidRotation}deg)`;

    requestAnimationFrame(() => this.updateLoop());
  }

  initDragAndDrop() {
    let activeWindow = null;
    let offset = { x: 0, y: 0 };
    let zIndex = 10;

    this.windows.forEach(win => {
      const header = win.querySelector('.window-header');
      
      header.addEventListener('mousedown', (e) => {
        activeWindow = win;
        activeWindow.style.zIndex = ++zIndex;
        
        const rect = win.getBoundingClientRect();
        
        // Offset relative to the screen content
        offset.x = e.clientX - rect.left;
        offset.y = e.clientY - rect.top;
        
        win.style.transition = 'none';
      });
    });

    window.addEventListener('mousemove', (e) => {
      if (!activeWindow) return;

      const screen = document.querySelector('.screen-content');
      const screenRect = screen.getBoundingClientRect();
      
      let x = e.clientX - screenRect.left - offset.x;
      let y = e.clientY - screenRect.top - offset.y;

      // Constrain to screen
      x = Math.max(0, Math.min(x, screenRect.width - activeWindow.offsetWidth));
      y = Math.max(0, Math.min(y, screenRect.height - activeWindow.offsetHeight));

      activeWindow.style.left = `${x}px`;
      activeWindow.style.top = `${y}px`;
    });

    window.addEventListener('mouseup', () => {
      if (activeWindow) {
        activeWindow.style.transition = 'transform 0.3s ease';
        activeWindow = null;
      }
    });
  }

  animateNumbers() {
    const metrics = document.querySelectorAll('.metric-value');
    metrics.forEach(metric => {
      const target = parseInt(metric.getAttribute('data-value'));
      let current = 0;
      const step = target / 100;
      
      const update = () => {
        if (current < target) {
          current += step;
          metric.textContent = Math.floor(current).toLocaleString();
          requestAnimationFrame(update);
        } else {
          metric.textContent = target.toLocaleString();
        }
      };
      
      // Delay animation slightly
      setTimeout(update, 1000);
    });

    // Animate bars
    const bars = document.querySelectorAll('.chart-bar');
    bars.forEach(bar => {
      setTimeout(() => {
        bar.style.height = bar.getAttribute('data-height');
      }, 1500);
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new MacbookHero();
});
