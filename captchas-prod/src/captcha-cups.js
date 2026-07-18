// captcha-cups.js
// Web Component independente - funciona em React, Angular, Vue, HTML puro

class CaptchaCupsElement extends HTMLElement {
  static get observedAttributes() {
    return ['target'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Estado do jogo
    this._copos = [];
    this._isShuffling = false;
    this._captchaResolvido = false;
    this._velocidadeEmbaralhamento = 350; // ms por movimento
    this._quantidadeMovimentos = 12;

    this.iniciar = this.iniciar.bind(this);
  }

  // ===== LIFECYCLE =====
  connectedCallback() {
    this.render();
    
    // Referências do DOM
    this.gameArea = this.shadowRoot.getElementById('game-area');
    this.mensagem = this.shadowRoot.getElementById('mensagem');
    this.reloadBtn = this.shadowRoot.getElementById('reload');
    this.overlay = this.shadowRoot.getElementById('overlay');

    // Eventos
    this.reloadBtn.addEventListener('click', () => {
       this.prepararJogo(); // Reinicia o estado
    });
    
    this.overlay.addEventListener('click', () => {
      if (!this._captchaResolvido && !this._isShuffling) this.iniciar();
    });

    this.prepararJogo();
  }

  // Utilidade para pausar a execução (ajuda nas animações)
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
          height: 140px;
          background-color: #ecf0f1;
          border-radius: 4px;
          border: 1px solid #bdc3c7;
          overflow: hidden;
        }
        
        .ground {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 30px;
          background-color: #bdc3c7;
          border-top: 1px solid #95a5a6;
        }

        .slot {
          position: absolute;
          bottom: 15px;
          width: 60px;
          height: 80px;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          transition: left ${this._velocidadeEmbaralhamento}ms ease-in-out;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .ball {
          position: absolute;
          bottom: 0;
          font-size: 30px;
          line-height: 30px;
          z-index: 1;
          opacity: 0;
        }
        
        .ball.visible {
          opacity: 1;
        }

        .cup {
          position: absolute;
          bottom: -5px;
          font-size: 60px;
          line-height: 60px;
          z-index: 2;
          transition: transform 0.4s ease;
        }

        .cup.lift {
          transform: translateY(-55px);
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
        <div class="header">Ache a bolinha para provar que é humano</div>
        
        <div class="game-area" id="game-area">
          <div class="ground"></div>
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
    
    // CORREÇÃO: Tem que ser false aqui para o overlay poder ser clicado!
    this._isShuffling = false; 

    const posBolinha = Math.floor(Math.random() * 3);

    const slots = this.gameArea.querySelectorAll('.slot');
    slots.forEach(s => s.remove());

    this._copos = [];

    for (let i = 0; i < 3; i++) {
      const slotEl = document.createElement('div');
      slotEl.className = 'slot';
      
      const ballEl = document.createElement('div');
      ballEl.className = 'ball';
      ballEl.textContent = '🔴';
      if (i === posBolinha) ballEl.classList.add('visible');

      const cupEl = document.createElement('div');
      cupEl.className = 'cup';
      cupEl.textContent = '🥤';

      slotEl.appendChild(ballEl);
      slotEl.appendChild(cupEl);
      this.gameArea.appendChild(slotEl);

      const copoObj = {
        id: i,
        pos: i,
        temBolinha: (i === posBolinha),
        elSlot: slotEl,
        elCup: cupEl
      };

      slotEl.addEventListener('click', () => this.escolherCopo(copoObj));
      this._copos.push(copoObj);
    }

    this.atualizarPosicoesDOM();

    this.mensagem.textContent = 'Aguardando...';
    this.mensagem.style.color = '#333';
    this.overlay.style.display = 'flex';
    this.overlay.textContent = 'Clique para começar';
    
    this._habilitarTarget(false);
  }

  calcularLeft(pos) {
    return 35 + (pos * 95);
  }

  atualizarPosicoesDOM() {
    this._copos.forEach(copo => {
      copo.elSlot.style.left = `${this.calcularLeft(copo.pos)}px`;
    });
  }

  async iniciar() {
    if (this._captchaResolvido || this._isShuffling) return;
    
    this._isShuffling = true; // Bloqueia cliques Múltiplos enquanto roda a animação
    this.overlay.style.display = 'none';
    this.mensagem.textContent = 'Preste atenção...';

    // Mostra onde a bolinha está
    const copoComBolinha = this._copos.find(c => c.temBolinha);
    await this.sleep(300);
    copoComBolinha.elCup.classList.add('lift');
    
    await this.sleep(1200); 
    
    // Abaixa o copo
    copoComBolinha.elCup.classList.remove('lift');
    await this.sleep(500);

    // Inicia o embaralhamento
    this.mensagem.textContent = 'Embaralhando...';
    await this.embaralhar();

    // Libera para o usuário escolher
    this.mensagem.textContent = 'Onde está a bolinha?';
    this._isShuffling = false; 
  }

  async embaralhar() {
    let ultimaTroca = [];

    for (let i = 0; i < this._quantidadeMovimentos; i++) {
      let posA, posB;

      do {
        posA = Math.floor(Math.random() * 3);
        posB = Math.floor(Math.random() * 3);
      } while (
        posA === posB || 
        (ultimaTroca.includes(posA) && ultimaTroca.includes(posB) && Math.random() > 0.3)
      );

      ultimaTroca = [posA, posB];

      let copoA = this._copos.find(c => c.pos === posA);
      let copoB = this._copos.find(c => c.pos === posB);

      copoA.pos = posB;
      copoB.pos = posA;

      this.atualizarPosicoesDOM();

      await this.sleep(this._velocidadeEmbaralhamento + 50);
    }
  }

  async escolherCopo(copoSelecionado) {
    if (this._isShuffling || this._captchaResolvido || this.overlay.style.display === 'flex') return;

    this._isShuffling = true; // Trava para não clicar em outros copos
    
    copoSelecionado.elCup.classList.add('lift');
    await this.sleep(500);

    if (copoSelecionado.temBolinha) {
      this.finalizarJogo(true, '✅ Acertou!');
    } else {
      const copoCerto = this._copos.find(c => c.temBolinha);
      copoCerto.elCup.classList.add('lift');
      
      this.finalizarJogo(false, '❌ Errou! Tente de novo.');
    }
  }

  finalizarJogo(venceu, textoMensagem) {
    this.mensagem.textContent = textoMensagem;
    
    if (venceu) {
      this._captchaResolvido = true;
      this.mensagem.style.color = '#2ecc71';
      this._habilitarTarget(true);

      this.dispatchEvent(new CustomEvent('captcha-resolved', { 
        detail: { metodo: 'shell-game' },
        bubbles: true,
        composed: true
      }));
    } else {
      this.mensagem.style.color = '#e74c3c';
      
      setTimeout(() => {
        // Prepara o jogo novamente para o usuário tentar de novo (reset)
        this.prepararJogo();
      }, 2000);

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
if (!customElements.get('captcha-cups')) {
  customElements.define('captcha-cups', CaptchaCupsElement);
}

export default CaptchaCupsElement;