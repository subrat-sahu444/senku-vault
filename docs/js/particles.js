/**
 * SENKU VAULT • SENKU ENGINE PARTICLE SYSTEM
 * Simulates quantum molecular bonds, photon excitation, atomic lattice structures,
 * and kinetic energy fields inspired by Dr. Stone's Kingdom of Science.
 */

class SenkuEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.particleCount = 100;
    this.enabled = true;
    
    // Mouse state for kinetic reaction
    this.mouse = {
      x: null,
      y: null,
      radius: 150,
      active: false
    };

    // Senku Scientific Color Palette: Emerald, Cyan, Electric Gold, Plasma White
    this.colors = [
      'rgba(0, 255, 136, ',   // Senku Emerald Green
      'rgba(0, 240, 255, ',   // Scientific Cyan
      'rgba(255, 215, 0, ',   // Kinetic Gold
      'rgba(16, 185, 129, ',  // Deep Emerald
      'rgba(255, 255, 255, '  // Excitation Photon White
    ];

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Mouse kinetic interaction
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;
    });

    window.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
      this.mouse.active = false;
    });

    // Touch events
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
        this.mouse.active = true;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.mouse.x = null;
      this.mouse.y = null;
      this.mouse.active = false;
    });

    this.spawnParticles();
    this.animate();
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(this.dpr, this.dpr);

    if (this.particles.length > 0) {
      this.spawnParticles();
    }
  }

  spawnParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    const colorBase = this.colors[Math.floor(Math.random() * this.colors.length)];
    const size = Math.random() * 2.4 + 0.8;
    const baseAlpha = Math.random() * 0.65 + 0.25;

    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: -Math.random() * 0.6 - 0.15, // Kinetic molecular excitation rising upwards
      size: size,
      colorBase: colorBase,
      alpha: baseAlpha,
      pulseSpeed: Math.random() * 0.025 + 0.008,
      pulseAngle: Math.random() * Math.PI * 2,
      charge: Math.random() > 0.5 ? 1 : -1
    };
  }

  setCount(count) {
    this.particleCount = count;
    this.spawnParticles();
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
    return this.enabled;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (!this.enabled) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    const count = this.particles.length;

    for (let i = 0; i < count; i++) {
      const p = this.particles[i];

      // Oscillating molecular glow
      p.pulseAngle += p.pulseSpeed;
      const currentAlpha = p.alpha + Math.sin(p.pulseAngle) * 0.18;

      // Molecular drift
      p.x += p.vx;
      p.y += p.vy;

      // Senku Engine: Kinetic Reaction Field around cursor
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.mouse.radius && dist > 1) {
          // Kinetic excitation: particles accelerate and swirl
          const force = (1 - dist / this.mouse.radius) * 2.2;
          const angle = Math.atan2(dy, dx);
          
          // Tangential swirl (orbital magnetic rotation around cursor) + repulsion
          p.x += Math.cos(angle) * force * 2.5 - Math.sin(angle) * force * 1.5 * p.charge;
          p.y += Math.sin(angle) * force * 2.5 + Math.cos(angle) * force * 1.5 * p.charge;
        }
      }

      // Screen boundary wrap-around (infinite scientific ascension)
      if (p.y < -10) {
        p.y = this.height + 10;
        p.x = Math.random() * this.width;
      } else if (p.y > this.height + 10) {
        p.y = -10;
      }

      if (p.x < -10) {
        p.x = this.width + 10;
      } else if (p.x > this.width + 10) {
        p.x = -10;
      }

      // Draw particle (quantum energy dot)
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `${p.colorBase}${Math.max(0.1, currentAlpha)})`;
      
      // Intense glow on key sparks
      if (p.size > 2.0) {
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = `${p.colorBase}0.9)`;
      }
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // Molecular lattice bonds (connecting lines when atoms are adjacent)
      for (let j = i + 1; j < count; j++) {
        const p2 = this.particles[j];
        const lineDist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (lineDist < 95) {
          const lineAlpha = (1 - lineDist / 95) * 0.16;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          // Emerald-cyan lattice bond
          this.ctx.strokeStyle = `rgba(0, 255, 136, ${lineAlpha})`;
          this.ctx.lineWidth = 0.7;
          this.ctx.stroke();
        }
      }
    }
  }
}

// Instantiate on load
window.senkuEngine = new SenkuEngine('senkuCanvas');
