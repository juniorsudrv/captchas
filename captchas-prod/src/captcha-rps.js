// captcha-rps.js
// Web Component independente - funciona em React, Angular, Vue, HTML puro

class CaptchaRpsElement extends HTMLElement {
  static get observedAttributes() {
    return ['target'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Configurações atualizadas com emojis de mão (renderizam muito melhor)
    this._opcoes = [
      { id: 'pedra', emoji: '✊', ganhaDe: 'tesoura' },
      { id: 'papel', emoji: '✋', ganhaDe: 'pedra' },
      { id: 'tesoura', emoji: '✌️', ganhaDe: 'papel' }
    ];
    
    // Estado do Jogo
    this._jogoAtivo = false;
    this._captchaResolvido = false;
    this._jogando = false; 

    this.iniciar = this.iniciar.bind(this);
  }

  // ===== LIFECYCLE =====
  connectedCallback() {
    this.render();
    
    this.cpuDisplay = this.shadowRoot.getElementById('cpu-display');
    this.mensagem = this.shadowRoot.getElementById('mensagem');
    this.reloadBtn = this.shadowRoot.getElementById('reload');
    this.overlay = this.shadowRoot.getElementById('overlay');
    this.botoes = this.shadowRoot.querySelectorAll('.option-btn');

    this.reloadBtn.addEventListener('click', () => {
      this.prepararJogo();
    });
    
    this.overlay.addEventListener('click', () => {
      if (!this._jogoAtivo && !this._captchaResolvido && !this._jogando) this.iniciar();
    });

    this.botoes.forEach(btn => {
      btn.addEventListener('click', () => this.jogar(btn.dataset.id));
    });

    this.prepararJogo();
  }

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
          background-color: #ecf0f1;
          border-radius: 4px;
          border: 1px solid #bdc3c7;
          padding: 15px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          overflow: hidden;
        }
        
        .arena {
          display: flex;
          justify-content: space-around;
          align-items: center;
          width: 100%;
          font-size: 40px;
          line-height: 1;
        }
        
        .cpu-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }
        .cpu-label {
          font-size: 12px;
          color: #7f8c8d;
          text-transform: uppercase;
          font-weight: bold;
        }

        .cpu-emoji {
          display: inline-block;
          transition: transform 0.2s;
        }

        .shaking {
          animation: shake 0.3s infinite alternate;
        }
        @keyframes shake {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(-5px) rotate(10deg); }
        }

        .options {
          display: flex;
          gap: 10px;
          justify-content: center;
        }
        
        .option-btn {
          font-size: 26px;
          width: 55px;
          height: 55px;
          border: 2px solid #bdc3c7;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        
        .option-btn:hover {
          background: #e0f7fa;
          border-color: #3498db;
          transform: translateY(-2px);
        }
        
        .option-btn:active {
          transform: translateY(0);
        }
        
        .option-btn.selected {
          border-color: #3498db;
          background: #d6eaf8;
          box-shadow: 0 0 8px rgba(52, 152, 219, 0.5);
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
        <div class="header">Vença o Robô para provar que é humano</div>
        
        <div class="game-area">
          <div class="arena">
            <div class="cpu-box">
              <span class="cpu-label">Robô</span>
              <span class="cpu-emoji" id="cpu-display">🤖</span>
            </div>
          </div>
          
          <div class="options">
            <!-- Botões atualizados com as mãos -->
            <button class="option-btn" data-id="pedra" title="Pedra">✊</button>
            <button class="option-btn" data-id="papel" title="Papel">✋</button>
            <button class="option-btn" data-id="tesoura" title="Tesoura">✌️</button>
          </div>

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
    this._jogoAtivo = false;
    this._captchaResolvido = false;
    this._jogando = false;
    
    this.cpuDisplay.textContent = '🤖';
    this.cpuDisplay.classList.remove('shaking');
    
    this.botoes.forEach(btn => btn.classList.remove('selected'));

    this.mensagem.textContent = 'Aguardando...';
    this.mensagem.style.color = '#333';
    
    this.overlay.style.display = 'flex';
    this.overlay.textContent = 'Clique para começar';
    
    this._habilitarTarget(false);
  }

  iniciar() {
    if (this._captchaResolvido || this._jogando) return;
    
    this._jogoAtivo = true;
    this.overlay.style.display = 'none';
    this.mensagem.textContent = 'Faça sua escolha...';
    this.mensagem.style.color = '#2c3e50';
    this.cpuDisplay.textContent = '🤖';
    this.botoes.forEach(btn => btn.classList.remove('selected'));
  }

  async jogar(idEscolhaUsuario) {
    if (!this._jogoAtivo || this._captchaResolvido || this._jogando) return;
    
    this._jogando = true; 

    this.botoes.forEach(btn => btn.classList.remove('selected'));
    const botaoSelecionado = this.shadowRoot.querySelector(`[data-id="${idEscolhaUsuario}"]`);
    botaoSelecionado.classList.add('selected');

    const escolhaUsuario = this._opcoes.find(opt => opt.id === idEscolhaUsuario);
    const escolhaCpu = this._opcoes[Math.floor(Math.random() * this._opcoes.length)];

    this.mensagem.textContent = 'Robô decidindo...';
    
    // O robô agora mostra um balão de pensamento enquanto escolhe
    this.cpuDisplay.textContent = '💭'; 
    this.cpuDisplay.classList.add('shaking');
    
    await this.sleep(1000); 
    
    this.cpuDisplay.classList.remove('shaking');
    // Robô mostra a mão que escolheu
    this.cpuDisplay.textContent = escolhaCpu.emoji;

    await this.sleep(300); 

    if (escolhaUsuario.id === escolhaCpu.id) {
      this.mensagem.textContent = '⚖️ Empate! Jogue de novo.';
      this.mensagem.style.color = '#f39c12';
      
      await this.sleep(1500);
      if (!this._captchaResolvido) this.iniciar(); 
      
      this._jogando = false;
      return;
    }

    if (escolhaUsuario.ganhaDe === escolhaCpu.id) {
      this.finalizarJogo(true, '✅ Você Venceu!');
    } else {
      this.finalizarJogo(false, '❌ Você Perdeu!');
    }
  }

  finalizarJogo(venceu, textoMensagem) {
    this._jogoAtivo = false;
    this.mensagem.textContent = textoMensagem;
    
    if (venceu) {
      this._captchaResolvido = true;
      this.mensagem.style.color = '#2ecc71';
      this.overlay.style.display = 'flex';
      this.overlay.textContent = 'Sucesso!';
      this._habilitarTarget(true);

      this.dispatchEvent(new CustomEvent('captcha-resolved', { 
        detail: { metodo: 'jokenpo' },
        bubbles: true,
        composed: true
      }));
    } else {
      this.mensagem.style.color = '#e74c3c';
      
      setTimeout(() => {
        this.overlay.textContent = 'Tentar Novamente';
        this.overlay.style.display = 'flex';
        this._jogando = false;
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
if (!customElements.get('captcha-rps')) {
  customElements.define('captcha-rps', CaptchaRpsElement);
}

export default CaptchaRpsElement;