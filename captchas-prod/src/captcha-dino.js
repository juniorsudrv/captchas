// captcha-dino.js
// Web Component independente - funciona em React, Angular, Vue, HTML puro

class CaptchaDinoElement extends HTMLElement {
  // Propriedades observadas para reatividade
  static get observedAttributes() {
    return ['target'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Configurações do jogo
    this._tempoObjetivo = 10; // 10 segundos para ganhar
    this._dinos = ['🦖', '🦕', '🐉', '🦘', '🐊']; // Variação do personagem
    this._obstaculos = ['🌵', '🪨', '🪵', '🍄', '🔥']; // Variação dos obstáculos
    
    // Estado do jogo
    this._jogoAtivo = false;
    this._captchaResolvido = false;
    this._startTime = null;
    this._animationFrameId = null;
    
    // Física
    this._dinoY = 100;
    this._dinoVy = 0;
    this._gravidade = 0.6;
    this._forcaPulo = -10;
    this._isJumping = false;
    
    this._obsX = 320;
    this._obsSpeed = 4;

    this.loop = this.loop.bind(this);
    this.pular = this.pular.bind(this);
  }

  // ===== LIFECYCLE =====
  connectedCallback() {
    this.render();
    
    // Referências do DOM
    this.container = this.shadowRoot.querySelector('.game-area');
    this.dinoEl = this.shadowRoot.getElementById('dino');
    this.dinoSprite = this.shadowRoot.getElementById('dino-sprite'); // Referência ao emoji espelhado
    this.obsEl = this.shadowRoot.getElementById('obstacle');
    this.mensagem = this.shadowRoot.getElementById('mensagem');
    this.barraProgresso = this.shadowRoot.getElementById('progress-bar');
    this.reloadBtn = this.shadowRoot.getElementById('reload');
    this.overlay = this.shadowRoot.getElementById('overlay');

    // Eventos
    this.container.addEventListener('click', this.pular);
    this.container.addEventListener('touchstart', (e) => { e.preventDefault(); this.pular(); }, {passive: false});
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        this.pular();
      }
    });
    this.reloadBtn.addEventListener('click', () => this.iniciar());
    this.overlay.addEventListener('click', () => {
      if (!this._jogoAtivo && !this._captchaResolvido) this.iniciar();
    });

    this.prepararJogo();
  }

  disconnectedCallback() {
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
    }
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
          height: 150px;
          background-color: #ecf0f1;
          border-radius: 4px;
          overflow: hidden;
          cursor: pointer;
          border: 1px solid #bdc3c7;
        }
        .ground {
          position: absolute;
          bottom: 10px;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: #7f8c8d;
        }
        
        /* Container do Personagem */
        #dino {
          position: absolute;
          left: 20px;
          top: 100px;
          z-index: 2;
          transform-origin: bottom center; /* Ponto de giro nos pés */
        }

        /* Sprite do Personagem (Onde a mágica de espelhar acontece) */
        .dino-sprite {
          font-size: 32px;
          line-height: 32px;
          display: inline-block;
          transform: scaleX(-1); /* <--- ESPELHA O EMOJI PARA A DIREITA */
        }

        /* Classes de Animação */
        .correndo {
          animation: correrAnim 0.25s infinite;
        }
        .pulando {
          transform: rotate(-15deg); /* Dinossauro empina para cima ao pular */
          transition: transform 0.1s;
        }

        /* Keyframes simulando a caminhada (wobble) */
        @keyframes correrAnim {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(-8deg); }
        }

        #obstacle {
          position: absolute;
          left: 320px;
          top: 110px;
          font-size: 24px;
          line-height: 24px;
          z-index: 1;
        }
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255,255,255,0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 16px;
          font-weight: bold;
          color: #2c3e50;
          z-index: 10;
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
          width: 0%;
          background: #3498db;
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
        <div class="header">Sobreviva por 10s para provar que é humano</div>
        
        <div class="game-area" title="Clique ou pressione Espaço para pular">
          <div class="ground"></div>
          <!-- O dino agora usa a div pai para animar e a span filha para ficar virada -->
          <div id="dino"><span class="dino-sprite" id="dino-sprite">🦖</span></div>
          <div id="obstacle">🌵</div>
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
  prepararJogo() {
    this._jogoAtivo = false;
    this._captchaResolvido = false;
    
    // Escolhe um dinossauro e obstáculo aleatórios iniciais (Atualiza a tag interna!)
    const dinoAleatorio = this._dinos[Math.floor(Math.random() * this._dinos.length)];
    this.dinoSprite.textContent = dinoAleatorio;
    this.obsEl.textContent = '🌵';
    
    // Remove animações
    this.dinoEl.classList.remove('correndo', 'pulando');

    // Reseta posições
    this._dinoY = 100;
    this._obsX = 320;
    this._obsSpeed = 4;
    this.dinoEl.style.top = `${this._dinoY}px`;
    this.obsEl.style.left = `${this._obsX}px`;
    
    this.barraProgresso.style.width = '0%';
    this.barraProgresso.style.background = '#3498db';
    
    this.mensagem.textContent = 'Aguardando...';
    this.mensagem.style.color = '#333';
    this.overlay.style.display = 'flex';
    this.overlay.textContent = 'Clique para começar';
    
    this._habilitarTarget(false);
  }

  iniciar() {
   
    
    this.prepararJogo();
    this.overlay.style.display = 'none';
    this._jogoAtivo = true;
    this._startTime = Date.now();
    this.mensagem.textContent = 'Correndo...';
    
    // Inicia a animação de corrida
    this.dinoEl.classList.add('correndo');

    if (this._animationFrameId) cancelAnimationFrame(this._animationFrameId);
    this._animationFrameId = requestAnimationFrame(this.loop);
  }

  pular() {
    if (!this._jogoAtivo && !this._captchaResolvido) {
      this.iniciar();
      return;
    }
    
    if (this._jogoAtivo && !this._isJumping) {
      this._isJumping = true;
      this._dinoVy = this._forcaPulo;
      
      // Troca a classe de animação para o pulo
      this.dinoEl.classList.remove('correndo');
      this.dinoEl.classList.add('pulando');
    }
  }

  loop() {
    if (!this._jogoAtivo) return;

    // --- Física do Dino ---
    this._dinoY += this._dinoVy;
    this._dinoVy += this._gravidade;

    // Colisão com o chão (Aterrisagem)
    if (this._dinoY >= 100) {
      this._dinoY = 100;
      this._dinoVy = 0;
      
      if (this._isJumping) {
        this._isJumping = false;
        // Retorna a animação de corrida ao tocar no chão
        this.dinoEl.classList.remove('pulando');
        this.dinoEl.classList.add('correndo');
      }
    }
    this.dinoEl.style.top = `${this._dinoY}px`;

    // --- Movimento do Obstáculo ---
    this._obsX -= this._obsSpeed;
    if (this._obsX < -30) {
      this._obsX = 320 + Math.random() * 80; 
      this._obsSpeed += 0.2; 
      
      const obstaculoAleatorio = this._obstaculos[Math.floor(Math.random() * this._obstaculos.length)];
      this.obsEl.textContent = obstaculoAleatorio;
    }
    this.obsEl.style.left = `${this._obsX}px`;

    // --- Detecção de Colisão ---
    const dinoHitbox = { left: 20, right: 45, top: this._dinoY, bottom: this._dinoY + 30 };
    const obsHitbox = { left: this._obsX, right: this._obsX + 20, top: 110, bottom: 135 };

    if (
      dinoHitbox.right > obsHitbox.left &&
      dinoHitbox.left < obsHitbox.right &&
      dinoHitbox.bottom > obsHitbox.top &&
      dinoHitbox.top < obsHitbox.bottom
    ) {
      this.finalizarJogo(false, '💥 Bateu! Tente de novo.');
      return;
    }

    // --- Verificação de Tempo (Vitória) ---
    const decorrido = (Date.now() - this._startTime) / 1000;
    const porcentagem = Math.min((decorrido / this._tempoObjetivo) * 100, 100);
    this.barraProgresso.style.width = `${porcentagem}%`;

    if (decorrido >= this._tempoObjetivo) {
      this.finalizarJogo(true, '✅ Verificado!');
      return;
    }

    // Continua o loop
    this._animationFrameId = requestAnimationFrame(this.loop);
  }

  finalizarJogo(venceu, textoMensagem) {
    this._jogoAtivo = false;
    this.mensagem.textContent = textoMensagem;
    this.overlay.style.display = 'flex';
    
    // Para as animações
    this.dinoEl.classList.remove('correndo', 'pulando');

    if (venceu) {
      this._captchaResolvido = true;
      this.mensagem.style.color = '#2ecc71';
      this.barraProgresso.style.background = '#2ecc71';
      this.overlay.textContent = 'Sucesso!';
      this._habilitarTarget(true);

      this.dispatchEvent(new CustomEvent('captcha-resolved', { 
        detail: { metodo: 'dino-runner' },
        bubbles: true,
        composed: true
      }));
    } else {
      this.mensagem.style.color = '#e74c3c';
      this.overlay.textContent = 'Tentar Novamente';
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
if (!customElements.get('captcha-dino')) {
  customElements.define('captcha-dino', CaptchaDinoElement);
}

export default CaptchaDinoElement;