// captcha-slingshot.js
// Web Component independente - funciona em React, Angular, Vue, HTML puro

class CaptchaSlingshotElement extends HTMLElement {
  static get observedAttributes() {
    return ['target'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Configurações do Jogo
    this._width = 320;
    this._height = 150;
    
    // Posição base do estilingue
    this._anchorX = 50;
    this._anchorY = 110;
    this._maxDrag = 45; // Máximo que o elástico estica
    
    // Física
    this._gravity = 0.25;
    this._powerMultiplier = 0.22;
    
    // Entidades
    this._bird = { x: 0, y: 0, vx: 0, vy: 0, radius: 12, emoji: '🐦' };
    this._target = { x: 0, y: 0, radius: 15, emoji: '🐷' };
    
    // Estado
    this._isDragging = false;
    this._isFlying = false;
    this._captchaResolvido = false;
    this._animationFrameId = null;

    this.iniciar = this.iniciar.bind(this);
    this.loop = this.loop.bind(this);
    this.handleStart = this.handleStart.bind(this);
    this.handleMove = this.handleMove.bind(this);
    this.handleEnd = this.handleEnd.bind(this);
  }

  // ===== LIFECYCLE =====
  connectedCallback() {
    this.render();
    
    // Referências do DOM
    this.canvas = this.shadowRoot.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.mensagem = this.shadowRoot.getElementById('mensagem');
    this.reloadBtn = this.shadowRoot.getElementById('reload');
    this.overlay = this.shadowRoot.getElementById('overlay');

    // Eventos
    // Eventos
    this.reloadBtn.addEventListener('click', () => {
      this.prepararJogo(); // Força o reset completo do jogo
    });
    
    this.overlay.addEventListener('click', () => {
      if (!this._captchaResolvido && !this._isFlying) this.iniciar();
    });

    // Eventos do Mouse / Touch
    this.canvas.addEventListener('mousedown', this.handleStart);
    this.canvas.addEventListener('mousemove', this.handleMove);
    window.addEventListener('mouseup', this.handleEnd);

    this.canvas.addEventListener('touchstart', this.handleStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleMove, { passive: false });
    window.addEventListener('touchend', this.handleEnd);

    this.prepararJogo();
  }

  disconnectedCallback() {
    if (this._animationFrameId) cancelAnimationFrame(this._animationFrameId);
  }

  // ===== RENDER =====
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: Arial, sans-serif;
          user-select: none;
        }
        .captcha-container {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #ddd;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          width: 320px;
        }
        .header {
          font-size: 14px;
          color: #333;
          margin-bottom: 15px;
          font-weight: bold;
          text-align: center;
        }
        .game-area {
          position: relative;
          background-color: #87CEEB; /* Céu azul */
          border-radius: 4px;
          border: 2px solid #bdc3c7;
          overflow: hidden;
          touch-action: none; /* Previne scroll no celular */
        }
        canvas {
          display: block;
          cursor: grab;
        }
        canvas:active {
          cursor: grabbing;
        }
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255,255,255,0.85);
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 16px;
          font-weight: bold;
          color: #2c3e50;
          z-index: 10;
          cursor: pointer;
        }
        .controls {
          margin-top: 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }
        .mensagem {
          font-size: 15px;
          font-weight: bold;
          min-height: 20px;
        }
        .reload-btn {
          border: none;
          outline: none;
          font-size: 20px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          background: #95a5a6;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: background 0.2s;
        }
        .reload-btn:hover {
          background: #7f8c8d;
        }
      </style>
      
      <div class="captcha-container">
        <div class="header">Acerte o alvo para provar que é humano</div>
        
        <div class="game-area">
          <canvas id="game-canvas" width="${this._width}" height="${this._height}"></canvas>
          <div id="overlay" class="overlay">Clique para começar</div>
        </div>

        <div class="controls">
          <div class="mensagem" id="mensagem">Aguardando...</div>
          <button class="reload-btn" id="reload" title="Reiniciar">↻</button>
        </div>
      </div>
    `;
  }

  // ===== LÓGICA DO JOGO =====
  prepararJogo() {
    this._captchaResolvido = false;
    this._isDragging = false;
    this._isFlying = false;

    // Reseta o pássaro pro estilingue
    this._bird.x = this._anchorX;
    this._bird.y = this._anchorY;
    this._bird.vx = 0;
    this._bird.vy = 0;

    // Sorteia posição do alvo (Pig) do lado direito
    this._target.x = 240 + Math.random() * 40; // Entre 240 e 280
    this._target.y = 50 + Math.random() * 60;  // Entre 50 e 110

    if (this._animationFrameId) cancelAnimationFrame(this._animationFrameId);

    this.desenhar();

    this.mensagem.textContent = 'Aguardando...';
    this.mensagem.style.color = '#333';
    this.overlay.style.display = 'flex';
    this.overlay.textContent = 'Clique para começar';
    
    this._habilitarTarget(false);
  }

  iniciar() {
    if (this._captchaResolvido) return;
    this.prepararJogo();
    this.overlay.style.display = 'none';
    this.mensagem.textContent = 'Arraste e solte!';
  }

  // ===== INTERAÇÕES DE ARRASTE =====
  obterPosicaoMouse(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  handleStart(e) {
    if (this._captchaResolvido || this.overlay.style.display === 'flex' || this._isFlying) return;
    if (e.cancelable) e.preventDefault();

    const pos = this.obterPosicaoMouse(e);
    
    // Verifica se clicou perto do pássaro
    const dx = pos.x - this._bird.x;
    const dy = pos.y - this._bird.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= 30) {
      this._isDragging = true;
    }
  }

  handleMove(e) {
    if (!this._isDragging) return;
    if (e.cancelable) e.preventDefault();

    const pos = this.obterPosicaoMouse(e);
    
    // Limita o arraste a um círculo ao redor da âncora
    const dx = pos.x - this._anchorX;
    const dy = pos.y - this._anchorY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this._maxDrag) {
      // Clampa a posição na borda do círculo
      this._bird.x = this._anchorX + (dx / dist) * this._maxDrag;
      this._bird.y = this._anchorY + (dy / dist) * this._maxDrag;
    } else {
      this._bird.x = pos.x;
      this._bird.y = pos.y;
    }

    this.desenhar();
  }

  handleEnd() {
    if (!this._isDragging) return;
    this._isDragging = false;

    // Calcula a distância que foi puxada
    const dx = this._anchorX - this._bird.x;
    const dy = this._anchorY - this._bird.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Se puxou muito pouco, só reseta (não atira)
    if (dist < 10) {
      this._bird.x = this._anchorX;
      this._bird.y = this._anchorY;
      this.desenhar();
      return;
    }

    // Calcula a velocidade baseada na puxada (direção oposta)
    this._bird.vx = dx * this._powerMultiplier;
    this._bird.vy = dy * this._powerMultiplier;
    
    this._isFlying = true;
    this.mensagem.textContent = 'Fiooouuu...';
    
    this.loop(); // Inicia o voo
  }

  // ===== FÍSICA E LOOP =====
  loop() {
    if (!this._isFlying) return;

    // Física
    this._bird.x += this._bird.vx;
    this._bird.y += this._bird.vy;
    this._bird.vy += this._gravity; // Gravidade puxando pra baixo

    // Colisão com o Alvo (Círculos)
    const dx = this._bird.x - this._target.x;
    const dy = this._bird.y - this._target.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < (this._bird.radius + this._target.radius)) {
      this.finalizarJogo(true);
      this.desenhar();
      return;
    }

    // Colisão com as bordas (Saiu da tela)
    if (this._bird.x > this._width + 20 || this._bird.y > this._height + 20 || this._bird.x < -20) {
      this.finalizarJogo(false);
      return;
    }

    // Chão falso
    if (this._bird.y > this._height - 10) {
      this._bird.y = this._height - 10;
      this._bird.vx *= 0.5; // Atrito
      this._bird.vy *= -0.5; // Quique fraco
      
      // Se parou de quicar, perdeu
      if (Math.abs(this._bird.vy) < 0.5 && Math.abs(this._bird.vx) < 0.1) {
        this.finalizarJogo(false);
        return;
      }
    }

    this.desenhar();
    this._animationFrameId = requestAnimationFrame(this.loop);
  }

  // ===== DESENHO =====
  desenhar() {
    this.ctx.clearRect(0, 0, this._width, this._height);

    // 1. Chão
    this.ctx.fillStyle = '#8FBC8F';
    this.ctx.fillRect(0, this._height - 10, this._width, 10);

    // 2. Trajetória tracejada (Apenas enquanto arrasta)
    if (this._isDragging) {
      this.desenharTrajetoria();
    }

    // 3. Estilingue (Haste de Trás)
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = '#5D4037';
    this.ctx.beginPath();
    this.ctx.moveTo(this._anchorX - 5, this._height - 10);
    this.ctx.lineTo(this._anchorX - 5, this._anchorY + 10);
    this.ctx.stroke();

    // 4. Elástico de Trás
    if (!this._isFlying) {
      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = '#3E2723';
      this.ctx.beginPath();
      this.ctx.moveTo(this._anchorX - 10, this._anchorY);
      this.ctx.lineTo(this._bird.x, this._bird.y);
      this.ctx.stroke();
    }

    // 5. Alvo (Porco)
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Desenha base do porco
    this.ctx.fillStyle = '#795548';
    this.ctx.fillRect(this._target.x - 15, this._target.y + 12, 30, this._height - (this._target.y + 12) - 10);
    
    this.ctx.fillText(this._target.emoji, this._target.x, this._target.y);

    // 6. Pássaro
    // Calcula o ângulo de rotação baseado na velocidade
    let angulo = 0;
    if (this._isFlying || this._isDragging) {
      const vx = this._isDragging ? (this._anchorX - this._bird.x) : this._bird.vx;
      const vy = this._isDragging ? (this._anchorY - this._bird.y) : this._bird.vy;
      angulo = Math.atan2(vy, vx);
    }

    this.ctx.save();
    this.ctx.translate(this._bird.x, this._bird.y);
    this.ctx.rotate(angulo);
    this.ctx.fillText(this._bird.emoji, 0, 0);
    this.ctx.restore();

    // 7. Elástico da Frente
    if (!this._isFlying) {
      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = '#4E342E';
      this.ctx.beginPath();
      this.ctx.moveTo(this._anchorX + 10, this._anchorY);
      this.ctx.lineTo(this._bird.x, this._bird.y);
      this.ctx.stroke();
    }

    // 8. Estilingue (Haste da Frente)
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = '#8D6E63';
    this.ctx.beginPath();
    this.ctx.moveTo(this._anchorX + 5, this._height - 10);
    this.ctx.lineTo(this._anchorX + 5, this._anchorY + 10);
    this.ctx.stroke();
  }

  // Previsão da física para desenhar a linha de ajuda
  desenharTrajetoria() {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    let simX = this._anchorX;
    let simY = this._anchorY;
    let simVx = (this._anchorX - this._bird.x) * this._powerMultiplier;
    let simVy = (this._anchorY - this._bird.y) * this._powerMultiplier;

    // Simula 25 quadros no futuro
    for (let i = 0; i < 25; i++) {
      simX += simVx;
      simVy += this._gravity;
      simY += simVy;

      // Pula os primeiros pontos para não ficar em cima do pássaro
      if (i > 2 && i % 2 === 0) {
        this.ctx.beginPath();
        this.ctx.arc(simX, simY, 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  // ===== CONCLUSÃO =====
  finalizarJogo(venceu) {
    this._isFlying = false;
    
    if (venceu) {
      this._captchaResolvido = true;
      this.mensagem.textContent = '✅ Na Mosca!';
      this.mensagem.style.color = '#2ecc71';
      this._habilitarTarget(true);

      this.dispatchEvent(new CustomEvent('captcha-resolved', { 
        detail: { metodo: 'slingshot' },
        bubbles: true,
        composed: true
      }));
    } else {
      this.mensagem.textContent = '❌ Errou!';
      this.mensagem.style.color = '#e74c3c';
      
      // Mostra tela de tentar novamente
      setTimeout(() => {
        this.overlay.textContent = 'Tentar Novamente';
        this.overlay.style.display = 'flex';
      }, 1000);

      this.dispatchEvent(new CustomEvent('captcha-failed', {
        bubbles: true,
        composed: true
      }));
    }
  }

  _habilitarTarget(habilitar) {
    const targetId = this.getAttribute('target');
    if (!targetId) return;

    const target = document.querySelector(targetId);
    if (target) {
      target.disabled = !habilitar;
    }
  }
}

// ===== REGISTRA O COMPONENTE =====
if (!customElements.get('captcha-slingshot')) {
  customElements.define('captcha-slingshot', CaptchaSlingshotElement);
}

export default CaptchaSlingshotElement;