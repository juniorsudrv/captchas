// captcha-tag.js
// Web Component independente - funciona em React, Angular, Vue, HTML puro

class CaptchaTagElement extends HTMLElement {
  static get observedAttributes() {
    return ['target'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Configurações do jogo
    this._personagens = ['🏃', '🐇', '🐁', '🦊', '💨'];
    this._areaWidth = 320;
    this._areaHeight = 150;
    this._runnerSize = 30; // Tamanho estimado do emoji
    this._tempoLimite = 15; // Segundos para pegar
    
    // Estado do Jogo
    this._jogoAtivo = false;
    this._captchaResolvido = false;
    this._animationFrameId = null;
    this._startTime = null;
    
    // Física do Personagem
    this._x = this._areaWidth / 2;
    this._y = this._areaHeight / 2;
    this._vx = 0;
    this._vy = 0;
    this._velocidadeMaxima = 4;
    this._forcaFuga = 0.8; // Quão rápido ele foge do mouse
    this._distanciaVisao = 80; // Raio em pixels para ele perceber o mouse
    
    // Mouse
    this._mouseX = -100;
    this._mouseY = -100;

    this.iniciar = this.iniciar.bind(this);
    this.loop = this.loop.bind(this);
    this.pegar = this.pegar.bind(this);
    this.atualizarMouse = this.atualizarMouse.bind(this);
  }

  // ===== LIFECYCLE =====
  connectedCallback() {
    this.render();
    
    // Referências
    this.gameArea = this.shadowRoot.getElementById('game-area');
    this.runnerEl = this.shadowRoot.getElementById('runner');
    this.mensagem = this.shadowRoot.getElementById('mensagem');
    this.reloadBtn = this.shadowRoot.getElementById('reload');
    this.overlay = this.shadowRoot.getElementById('overlay');
    this.barraProgresso = this.shadowRoot.getElementById('progress-bar');

    // Eventos
    this.reloadBtn.addEventListener('click', () => this.prepararJogo());
    this.overlay.addEventListener('click', () => {
      if (!this._jogoAtivo && !this._captchaResolvido) this.iniciar();
    });

    // Rastrear mouse/touch para a fuga
    this.gameArea.addEventListener('mousemove', this.atualizarMouse);
    this.gameArea.addEventListener('touchmove', this.atualizarMouse, { passive: true });
    this.gameArea.addEventListener('mouseleave', () => {
      this._mouseX = -100;
      this._mouseY = -100;
    });

    // Evento de vitória (clicar no personagem)
    this.runnerEl.addEventListener('mousedown', this.pegar);
    this.runnerEl.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Previne comportamento duplo no mobile
      this.pegar();
    }, { passive: false });

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
          margin-bottom: 10px;
          font-weight: bold;
          text-align: center;
        }
        .game-area {
          position: relative;
          width: 100%;
          height: ${this._areaHeight}px;
          background-color: #e0f7fa;
          border-radius: 4px;
          border: 2px solid #bdc3c7;
          overflow: hidden;
          cursor: crosshair;
        }
        
        .runner {
          position: absolute;
          width: ${this._runnerSize}px;
          height: ${this._runnerSize}px;
          font-size: 24px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transform-origin: center;
          transition: transform 0.1s ease;
          /* Centraliza o pivô de movimento no meio do emoji */
          margin-left: -${this._runnerSize / 2}px;
          margin-top: -${this._runnerSize / 2}px;
        }

        /* Efeito de olhar para a direção certa */
        .virado-esquerda {
          transform: scaleX(-1);
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
        
        .progress-container {
          width: 100%;
          height: 8px;
          background: #dfe6e9;
          border-radius: 4px;
          margin-top: 10px;
          overflow: hidden;
        }
        #progress-bar {
          height: 100%;
          width: 100%;
          background: #e74c3c;
          transition: width 0.1s linear;
        }

        .controls {
          margin-top: 10px;
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
        <div class="header">Pegue o fujão para provar que é humano</div>
        
        <div class="game-area" id="game-area">
          <div id="runner" class="runner">🏃</div>
          <div id="overlay" class="overlay">Clique para começar</div>
        </div>

        <div class="progress-container">
          <div id="progress-bar"></div>
        </div>

        <div class="controls">
          <div class="mensagem" id="mensagem">Aguardando...</div>
          <button class="reload-btn" id="reload" title="Reiniciar">↻</button>
        </div>
      </div>
    `;
  }

  // ===== LÓGICA DO JOGO =====
  atualizarMouse(e) {
    if (!this._jogoAtivo) return;
    const rect = this.gameArea.getBoundingClientRect();
    
    if (e.touches) {
      this._mouseX = e.touches[0].clientX - rect.left;
      this._mouseY = e.touches[0].clientY - rect.top;
    } else {
      this._mouseX = e.clientX - rect.left;
      this._mouseY = e.clientY - rect.top;
    }
  }

  prepararJogo() {
    this._jogoAtivo = false;
    this._captchaResolvido = false;
    if (this._animationFrameId) cancelAnimationFrame(this._animationFrameId);

    // Sorteia personagem
    const emoji = this._personagens[Math.floor(Math.random() * this._personagens.length)];
    this.runnerEl.textContent = emoji;

    // Reseta Posições (No centro)
    this._x = this._areaWidth / 2;
    this._y = this._areaHeight / 2;
    this._vx = (Math.random() - 0.5) * 2; // Começa vagando de leve
    this._vy = (Math.random() - 0.5) * 2;
    this.runnerEl.style.left = `${this._x}px`;
    this.runnerEl.style.top = `${this._y}px`;

    this.barraProgresso.style.width = '100%';
    this.barraProgresso.style.background = '#e74c3c';

    this.mensagem.textContent = 'Aguardando...';
    this.mensagem.style.color = '#333';
    this.overlay.style.display = 'flex';
    this.overlay.textContent = 'Clique para começar';
    
    this._habilitarTarget(false);
  }

  iniciar() {
    if (this._captchaResolvido) return;
    
    this.overlay.style.display = 'none';
    this._jogoAtivo = true;
    this._startTime = Date.now();
    this.mensagem.textContent = 'Pegue ele!';
    
    this.loop();
  }

  pegar() {
    if (!this._jogoAtivo) return;
    this.finalizarJogo(true, '✅ Capturado!');
  }

  loop() {
    if (!this._jogoAtivo) return;

    // --- Física de Repulsão (Fuga) ---
    const dx = this._x - this._mouseX;
    const dy = this._y - this._mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0 && dist < this._distanciaVisao) {
      // Se o mouse chegou perto, empurra ele na direção oposta
      this._vx += (dx / dist) * this._forcaFuga;
      this._vy += (dy / dist) * this._forcaFuga;
    } else {
      // Se está longe do mouse, vagueia um pouco aleatoriamente
      this._vx += (Math.random() - 0.5) * 0.5;
      this._vy += (Math.random() - 0.5) * 0.5;
    }

    // --- Limite de Velocidade ---
    const speed = Math.sqrt(this._vx * this._vx + this._vy * this._vy);
    if (speed > this._velocidadeMaxima) {
      this._vx = (this._vx / speed) * this._velocidadeMaxima;
      this._vy = (this._vy / speed) * this._velocidadeMaxima;
    }

    // --- Atualiza Posição ---
    this._x += this._vx;
    this._y += this._vy;

    // --- Colisão com as Paredes (Bater e Voltar) ---
    const margem = this._runnerSize / 2;
    if (this._x < margem) {
      this._x = margem;
      this._vx *= -1;
    } else if (this._x > this._areaWidth - margem) {
      this._x = this._areaWidth - margem;
      this._vx *= -1;
    }

    if (this._y < margem) {
      this._y = margem;
      this._vy *= -1;
    } else if (this._y > this._areaHeight - margem) {
      this._y = this._areaHeight - margem;
      this._vy *= -1;
    }

    // --- Aplicar Visual ---
    this.runnerEl.style.left = `${this._x}px`;
    this.runnerEl.style.top = `${this._y}px`;

    // Vira o personagem para o lado que está correndo
    if (this._vx > 0.5) {
      this.runnerEl.classList.remove('virado-esquerda');
    } else if (this._vx < -0.5) {
      this.runnerEl.classList.add('virado-esquerda');
    }

    // --- Temporizador ---
    const decorrido = (Date.now() - this._startTime) / 1000;
    const tempoRestante = this._tempoLimite - decorrido;
    const porcentagem = Math.max((tempoRestante / this._tempoLimite) * 100, 0);
    
    this.barraProgresso.style.width = `${porcentagem}%`;

    if (decorrido >= this._tempoLimite) {
      this.finalizarJogo(false, '❌ Escapou! Tente de novo.');
      return;
    }

    this._animationFrameId = requestAnimationFrame(this.loop);
  }

  finalizarJogo(venceu, textoMensagem) {
    this._jogoAtivo = false;
    this.mensagem.textContent = textoMensagem;
    
    if (venceu) {
      this._captchaResolvido = true;
      this.mensagem.style.color = '#2ecc71';
      this.barraProgresso.style.background = '#2ecc71';
      this.barraProgresso.style.width = '100%';
      this.overlay.style.display = 'flex';
      this.overlay.textContent = 'Sucesso!';
      this._habilitarTarget(true);

      this.dispatchEvent(new CustomEvent('captcha-resolved', { 
        detail: { metodo: 'tag-game' },
        bubbles: true,
        composed: true
      }));
    } else {
      this.mensagem.style.color = '#e74c3c';
      this.overlay.textContent = 'Tentar Novamente';
      this.overlay.style.display = 'flex';
      
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
if (!customElements.get('captcha-tag')) {
  customElements.define('captcha-tag', CaptchaTagElement);
}

export default CaptchaTagElement;