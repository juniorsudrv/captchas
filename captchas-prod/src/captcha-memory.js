// captcha-memory.js
// Web Component independente - funciona em React, Angular, Vue, HTML puro

class CaptchaMemoryElement extends HTMLElement {
  // Propriedades observadas para reatividade
  static get observedAttributes() {
    return ['target'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Configurações do jogo
    this._emojis = ['🤖', '👽', '👾', '👻']; // 4 pares = 8 cartas
    
    // Estado do jogo
    this._cartas = [];
    this._cartasViradas = []; // Guarda os índices das cartas viradas na jogada atual
    this._paresEncontrados = 0;
    this._tabuleiroBloqueado = false;
    this._captchaResolvido = false;

    this.iniciar = this.iniciar.bind(this);
  }

  // ===== LIFECYCLE =====
  connectedCallback() {
    this.render();
    
    // Referências do DOM
    this.boardEl = this.shadowRoot.getElementById('memory-board');
    this.mensagem = this.shadowRoot.getElementById('mensagem');
    this.reloadBtn = this.shadowRoot.getElementById('reload');
    this.overlay = this.shadowRoot.getElementById('overlay');

    // Eventos
    // Eventos
    this.reloadBtn.addEventListener('click', () => {
      this.prepararJogo(); // Força o reset completo do jogo
    });
    
    this.overlay.addEventListener('click', () => {
      if (!this._captchaResolvido) this.iniciar();
    });

    this.prepararJogo();
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
          width: 100%;
          min-height: 150px;
          border-radius: 4px;
        }
        .memory-board {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          width: 100%;
        }
        
        /* Estilos das Cartas (Efeito 3D) */
        .card {
          width: 100%;
          aspect-ratio: 1 / 1;
          perspective: 1000px;
          cursor: pointer;
        }
        .card-inner {
          width: 100%;
          height: 100%;
          position: relative;
          transition: transform 0.5s;
          transform-style: preserve-3d;
        }
        .card.flipped .card-inner, 
        .card.matched .card-inner {
          transform: rotateY(180deg);
        }
        .card-front, .card-back {
          width: 100%;
          height: 100%;
          position: absolute;
          backface-visibility: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        }
        .card-front {
          background-color: #3498db;
          color: white;
          font-size: 24px;
        }
        .card-back {
          background-color: #ecf0f1;
          transform: rotateY(180deg);
        }
        .card.matched .card-back {
          background-color: #d4efdf;
          border: 2px solid #2ecc71;
        }

        .overlay {
          position: absolute;
          top: -5px;
          left: -5px;
          width: calc(100% + 10px);
          height: calc(100% + 10px);
          background: rgba(255,255,255,0.85);
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 16px;
          font-weight: bold;
          color: #2c3e50;
          z-index: 10;
          border-radius: 4px;
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
        <div class="header">Encontre os pares para provar que é humano</div>
        
        <div class="game-area">
          <div id="memory-board" class="memory-board"></div>
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
    this._tabuleiroBloqueado = true; // Bloqueia cliques até clicar em iniciar
    this._cartasViradas = [];
    this._paresEncontrados = 0;
    
    // Cria o baralho duplicando os emojis e embaralhando
    const baralho = [...this._emojis, ...this._emojis];
    baralho.sort(() => Math.random() - 0.5);

    this._cartas = baralho.map((emoji, index) => ({
      id: index,
      emoji: emoji,
      virada: false,
      encontrada: false
    }));

    this.renderizarCartas();

    this.mensagem.textContent = 'Aguardando...';
    this.mensagem.style.color = '#333';
    this.overlay.style.display = 'flex';
    this.overlay.textContent = 'Clique para começar';
    
    this._habilitarTarget(false);
  }

  iniciar() {
    if (this._captchaResolvido) return;
    
    this.prepararJogo(); // Re-embaralha se for um restart
    this.overlay.style.display = 'none';
    this._tabuleiroBloqueado = false;
    this.mensagem.textContent = 'Encontre os pares...';
  }

  renderizarCartas() {
    this.boardEl.innerHTML = ''; // Limpa o tabuleiro

    this._cartas.forEach((carta, index) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'card';
      cardEl.dataset.index = index;
      
      cardEl.innerHTML = `
        <div class="card-inner">
          <div class="card-front">?</div>
          <div class="card-back">${carta.emoji}</div>
        </div>
      `;

      cardEl.addEventListener('click', () => this.virarCarta(index, cardEl));
      this.boardEl.appendChild(cardEl);
    });
  }

  virarCarta(index, cardEl) {
    // Evita virar se o tabuleiro estiver bloqueado, a carta já estiver virada ou o jogo já tiver sido resolvido
    if (this._tabuleiroBloqueado || this._cartas[index].virada || this._cartas[index].encontrada || this._captchaResolvido) {
      return;
    }

    // Vira a carta visualmente e no estado
    this._cartas[index].virada = true;
    cardEl.classList.add('flipped');
    this._cartasViradas.push({ index, elemento: cardEl, emoji: this._cartas[index].emoji });

    // Checa se duas cartas foram viradas
    if (this._cartasViradas.length === 2) {
      this.verificarPar();
    }
  }

  verificarPar() {
    this._tabuleiroBloqueado = true; // Bloqueia cliques enquanto checa
    const [carta1, carta2] = this._cartasViradas;

    if (carta1.emoji === carta2.emoji) {
      // Deu Match!
      this._cartas[carta1.index].encontrada = true;
      this._cartas[carta2.index].encontrada = true;
      
      carta1.elemento.classList.add('matched');
      carta2.elemento.classList.add('matched');
      
      this._paresEncontrados++;
      this._cartasViradas = [];
      this._tabuleiroBloqueado = false;

      // Verifica vitória
      if (this._paresEncontrados === this._emojis.length) {
        this.finalizarJogo(true);
      }
    } else {
      // Errou! Aguarda 1 segundo e desvira as cartas
      setTimeout(() => {
        this._cartas[carta1.index].virada = false;
        this._cartas[carta2.index].virada = false;
        
        carta1.elemento.classList.remove('flipped');
        carta2.elemento.classList.remove('flipped');
        
        this._cartasViradas = [];
        this._tabuleiroBloqueado = false;
      }, 1000);
    }
  }

  finalizarJogo(venceu) {
    if (venceu) {
      this._captchaResolvido = true;
      this.mensagem.textContent = '✅ Verificado!';
      this.mensagem.style.color = '#2ecc71';
      this._habilitarTarget(true);

      this.dispatchEvent(new CustomEvent('captcha-resolved', { 
        detail: { metodo: 'memory-game', tempo: 'concluido' },
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
if (!customElements.get('captcha-memory')) {
  customElements.define('captcha-memory', CaptchaMemoryElement);
}

export default CaptchaMemoryElement;