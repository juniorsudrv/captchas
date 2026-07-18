// captcha-simon.js
// Web Component independente - funciona em React, Angular, Vue, HTML puro

class CaptchaSimonElement extends HTMLElement {
  static get observedAttributes() {
    return ['target'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Configurações do Jogo
    this._objetivoRodadas = 4; // Quantos passos o usuário precisa acertar para provar que é humano
    
    // Sons (Frequências do Simon original)
    this._cores = [
      { id: 0, cor: '#2ecc71', corAtiva: '#58d68d', freq: 415.30 }, // Verde (G#4)
      { id: 1, cor: '#e74c3c', corAtiva: '#ec7063', freq: 311.13 }, // Vermelho (D#4)
      { id: 2, cor: '#f1c40f', corAtiva: '#f4d03f', freq: 254.18 }, // Amarelo (C#4)
      { id: 3, cor: '#3498db', corAtiva: '#5dade2', freq: 207.65 }  // Azul (G#3)
    ];
    
    // Estado do jogo
    this._sequencia = [];
    this._passoAtual = 0;
    this._bloqueado = true; // Bloqueia cliques do usuário
    this._captchaResolvido = false;
    this._audioCtx = null;

    this.iniciar = this.iniciar.bind(this);
    this.prepararJogo = this.prepararJogo.bind(this);
  }

  // ===== LIFECYCLE =====
  connectedCallback() {
    this.render();
    
    // Referências do DOM
    this.mensagem = this.shadowRoot.getElementById('mensagem');
    this.reloadBtn = this.shadowRoot.getElementById('reload');
    this.overlay = this.shadowRoot.getElementById('overlay');
    this.botoes = this.shadowRoot.querySelectorAll('.simon-btn');
    this.barraProgresso = this.shadowRoot.getElementById('progress-bar');

    // Eventos
    this.reloadBtn.addEventListener('click', () => {
      this.prepararJogo();
    });
    
    this.overlay.addEventListener('click', () => {
      if (!this._captchaResolvido) this.iniciar();
    });

    this.botoes.forEach(btn => {
      // Suporte a mouse e touch
      btn.addEventListener('mousedown', (e) => this.lidarComClique(e, parseInt(btn.dataset.id)));
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault(); 
        this.lidarComClique(e, parseInt(btn.dataset.id));
      }, { passive: false });
    });

    this.prepararJogo();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===== AUDIO API NATIVA =====
  inicializarAudio() {
    if (!this._audioCtx) {
      // Inicia o contexto de áudio na primeira interação do usuário (Regra dos navegadores)
      this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._audioCtx.state === 'suspended') {
      this._audioCtx.resume();
    }
  }

  tocarSom(freq, tipo = 'sine', duracao = 300) {
    if (!this._audioCtx) return;
    
    const osc = this._audioCtx.createOscillator();
    const gain = this._audioCtx.createGain();
    
    osc.type = tipo;
    osc.frequency.value = freq;
    
    osc.connect(gain);
    gain.connect(this._audioCtx.destination);
    
    osc.start();
    // Fade out suave para evitar "cliques" no final do som
    gain.gain.exponentialRampToValueAtTime(0.00001, this._audioCtx.currentTime + duracao / 1000);
    osc.stop(this._audioCtx.currentTime + duracao / 1000);
  }

  tocarErro() {
    this.tocarSom(100, 'sawtooth', 500); // Som de buzina de erro
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
          background-color: #ecf0f1;
          border-radius: 4px;
          border: 1px solid #bdc3c7;
          padding: 20px 0;
          display: flex;
          justify-content: center;
          overflow: hidden;
        }
        
        /* Grid do Genius */
        .simon-board {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          width: 140px;
          height: 140px;
          border-radius: 50%; /* Faz um círculo perfeito no fundo opcionalmente */
        }
        
        .simon-btn {
          border: none;
          border-radius: 15px;
          cursor: pointer;
          opacity: 0.6;
          transition: transform 0.1s, opacity 0.1s, box-shadow 0.1s;
          box-shadow: inset -3px -3px 5px rgba(0,0,0,0.2);
          -webkit-tap-highlight-color: transparent;
        }
        
        /* Cores Base */
        .simon-btn[data-id="0"] { background-color: ${this._cores[0].cor}; border-top-left-radius: 100%; }
        .simon-btn[data-id="1"] { background-color: ${this._cores[1].cor}; border-top-right-radius: 100%; }
        .simon-btn[data-id="2"] { background-color: ${this._cores[2].cor}; border-bottom-left-radius: 100%; }
        .simon-btn[data-id="3"] { background-color: ${this._cores[3].cor}; border-bottom-right-radius: 100%; }

        /* Estado Ativo (Piscando ou Pressionado) */
        .simon-btn.active {
          opacity: 1;
          transform: scale(0.95);
          box-shadow: 0 0 15px currentColor;
        }
        .simon-btn[data-id="0"].active { background-color: ${this._cores[0].corAtiva}; color: ${this._cores[0].corAtiva}; }
        .simon-btn[data-id="1"].active { background-color: ${this._cores[1].corAtiva}; color: ${this._cores[1].corAtiva}; }
        .simon-btn[data-id="2"].active { background-color: ${this._cores[2].corAtiva}; color: ${this._cores[2].corAtiva}; }
        .simon-btn[data-id="3"].active { background-color: ${this._cores[3].corAtiva}; color: ${this._cores[3].corAtiva}; }

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
          height: 6px;
          background: #dfe6e9;
          border-radius: 3px;
          margin-top: 15px;
          overflow: hidden;
        }
        #progress-bar {
          height: 100%;
          width: 0%;
          background: #3498db;
          transition: width 0.3s ease;
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
        <div class="header">Repita a sequência para provar que é humano</div>
        
        <div class="game-area">
          <div class="simon-board">
            <button class="simon-btn" data-id="0"></button>
            <button class="simon-btn" data-id="1"></button>
            <button class="simon-btn" data-id="2"></button>
            <button class="simon-btn" data-id="3"></button>
          </div>

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
    this._captchaResolvido = false;
    this._bloqueado = true;
    this._sequencia = [];
    this._passoAtual = 0;
    
    // Tira os efeitos de ativo de todos os botões por segurança
    this.botoes.forEach(b => b.classList.remove('active'));

    this.barraProgresso.style.width = '0%';
    this.barraProgresso.style.background = '#3498db';

    this.mensagem.textContent = 'Aguardando...';
    this.mensagem.style.color = '#333';
    
    this.overlay.style.display = 'flex';
    this.overlay.textContent = 'Clique para começar';
    
    this._habilitarTarget(false);
  }

  async iniciar() {
    if (this._captchaResolvido) return;
    
    this.inicializarAudio(); // Prepara os sons
    
    this.overlay.style.display = 'none';
    await this.sleep(500); // Pequena pausa dramática antes de começar

    this.proximaRodada();
  }

  async proximaRodada() {
    this._bloqueado = true;
    this._passoAtual = 0;
    
    // Atualiza progresso e mensagem
    const progresso = (this._sequencia.length / this._objetivoRodadas) * 100;
    this.barraProgresso.style.width = `${progresso}%`;
    this.mensagem.textContent = 'Preste atenção...';

    // Adiciona uma nova cor aleatória à sequência
    this._sequencia.push(Math.floor(Math.random() * 4));

    await this.sleep(500);

    // Reproduz a sequência
    for (let i = 0; i < this._sequencia.length; i++) {
      const idCor = this._sequencia[i];
      await this.piscarBotao(idCor);
      await this.sleep(250); // Intervalo entre os piscas
    }

    // Libera para o usuário jogar
    this.mensagem.textContent = 'Sua vez!';
    this._bloqueado = false;
  }

  async piscarBotao(id) {
    const btn = this.shadowRoot.querySelector(`.simon-btn[data-id="${id}"]`);
    const corConfig = this._cores[id];
    
    this.tocarSom(corConfig.freq);
    
    btn.classList.add('active');
    await this.sleep(300); // Tempo que fica aceso
    btn.classList.remove('active');
  }

  async lidarComClique(e, idCorClicada) {
    if (this._bloqueado || this._captchaResolvido) return;

    // Pisca o botão clicado
    this.piscarBotao(idCorClicada);

    // Verifica se acertou
    const corCorreta = this._sequencia[this._passoAtual];
    
    if (idCorClicada === corCorreta) {
      // Acertou o passo!
      this._passoAtual++;

      // Verificou a sequência inteira?
      if (this._passoAtual === this._sequencia.length) {
        this._bloqueado = true; // Bloqueia cliques para evitar bagunça
        
        // Venceu o Captcha inteiro?
        if (this._sequencia.length === this._objetivoRodadas) {
          await this.sleep(500);
          this.finalizarJogo(true);
        } else {
          // Passa para a próxima rodada
          this.mensagem.textContent = 'Boa!';
          setTimeout(() => this.proximaRodada(), 800);
        }
      }
    } else {
      // Errou!
      this._bloqueado = true;
      this.tocarErro();
      
      // Pisca a tela toda rapidinho para dar feedback visual de erro
      this.botoes.forEach(b => b.classList.add('active'));
      await this.sleep(300);
      this.botoes.forEach(b => b.classList.remove('active'));

      this.finalizarJogo(false);
    }
  }

  finalizarJogo(venceu) {
    this._bloqueado = true;
    
    if (venceu) {
      this._captchaResolvido = true;
      this.mensagem.textContent = '✅ Memória perfeita!';
      this.mensagem.style.color = '#2ecc71';
      this.barraProgresso.style.width = '100%';
      this.barraProgresso.style.background = '#2ecc71';
      
      this._habilitarTarget(true);
      
      // Toca um acorde de vitória
      this.tocarSom(this._cores[0].freq, 'sine', 150);
      setTimeout(() => this.tocarSom(this._cores[2].freq, 'sine', 150), 150);
      setTimeout(() => this.tocarSom(this._cores[3].freq, 'sine', 400), 300);

      this.dispatchEvent(new CustomEvent('captcha-resolved', { 
        detail: { metodo: 'simon-says' },
        bubbles: true,
        composed: true
      }));
    } else {
      this.mensagem.textContent = '❌ Sequência errada!';
      this.mensagem.style.color = '#e74c3c';
      this.barraProgresso.style.background = '#e74c3c';
      
      setTimeout(() => {
        this.overlay.textContent = 'Tentar Novamente';
        this.overlay.style.display = 'flex';
      }, 1500);

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
if (!customElements.get('captcha-simon')) {
  customElements.define('captcha-simon', CaptchaSimonElement);
}

export default CaptchaSimonElement;