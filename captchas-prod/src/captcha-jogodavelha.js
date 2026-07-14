// captcha-velha.js
// Web Component independente - funciona em React, Angular, Vue, HTML puro

class CaptchaVelhaElement extends HTMLElement {
  // Propriedades observadas para reatividade
  static get observedAttributes() {
    return ['target'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._tabuleiro = Array(9).fill('');
    this._jogoAtivo = true;
    this._captchaResolvido = false;
    this._jogador = 'X';
    this._maquina = 'O';
  }

  // ===== LIFECYCLE =====
  connectedCallback() {
    this.render();
    this.iniciar();
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
        }
        .header {
          font-size: 14px;
          color: #333;
          margin-bottom: 10px;
          font-weight: bold;
          text-align: center;
        }
        .board {
          display: grid;
          grid-template-columns: repeat(3, 60px);
          grid-template-rows: repeat(3, 60px);
          gap: 5px;
          background-color: #34495e;
          padding: 5px;
          border-radius: 4px;
        }
        .cell {
          background-color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 32px;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .cell:hover {
          background-color: #f1f1f1;
        }
        .cell.x { color: #3498db; }
        .cell.o { color: #e74c3c; }
        .controls {
          margin-top: 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }
        .mensagem {
          font-size: 16px;
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
        <div class="header">Ganhe o jogo para provar que é humano</div>
        <div class="board" id="board">
          ${Array(9).fill('<div class="cell" data-index=""></div>').map((html, i) => html.replace('data-index=""', `data-index="${i}"`)).join('')}
        </div>
        <div class="controls">
          <div class="mensagem" id="mensagem">Sua vez (X)</div>
          <button class="reload-btn" id="reload" title="Reiniciar">↻</button>
        </div>
      </div>
    `;

    // Referências
    this.board = this.shadowRoot.getElementById('board');
    this.cells = this.shadowRoot.querySelectorAll('.cell');
    this.mensagem = this.shadowRoot.getElementById('mensagem');
    this.reloadBtn = this.shadowRoot.getElementById('reload');

    // Eventos
    this.cells.forEach(cell => {
      cell.addEventListener('click', (e) => this.jogadaUsuario(e.target));
    });
    this.reloadBtn.addEventListener('click', () => this.iniciar());
  }

  // ===== LÓGICA PRINCIPAL =====
  iniciar() {
    this._tabuleiro = Array(9).fill('');
    this._jogoAtivo = true;
    this._captchaResolvido = false;
    
    this.cells.forEach(cell => {
      cell.textContent = '';
      cell.className = 'cell';
    });

    this.mensagem.textContent = 'Sua vez (X)';
    this.mensagem.style.color = '#333';
    this._habilitarTarget(false);
  }

  jogadaUsuario(celula) {
    const index = celula.getAttribute('data-index');

    // Ignora se a célula já estiver preenchida ou o jogo acabou
    if (this._tabuleiro[index] !== '' || !this._jogoAtivo || this._captchaResolvido) {
      return;
    }

    // Jogada do Usuário
    this._tabuleiro[index] = this._jogador;
    celula.textContent = this._jogador;
    celula.classList.add(this._jogador.toLowerCase());

    if (this.verificarVencedor(this._jogador)) {
      this.finalizarJogo(true, '✅ Verificado!');
      return;
    }

    if (this.verificarEmpate()) {
      this.finalizarJogo(false, '⚠️ Empate! Tente de novo.');
      return;
    }

    // Turno da Máquina
    this._jogoAtivo = false; // Bloqueia cliques temporariamente
    this.mensagem.textContent = 'Pensando...';
    
    setTimeout(() => {
      this.jogadaMaquina();
    }, 400); // Pequeno delay para parecer que a máquina está "pensando"
  }

  jogadaMaquina() {
    const celulasVazias = this._tabuleiro
      .map((val, index) => val === '' ? index : null)
      .filter(val => val !== null);

    if (celulasVazias.length > 0) {
      // Máquina escolhe um espaço aleatório para ser fácil de ganhar
      const indexAleatorio = celulasVazias[Math.floor(Math.random() * celulasVazias.length)];
      
      this._tabuleiro[indexAleatorio] = this._maquina;
      const celula = this.cells[indexAleatorio];
      celula.textContent = this._maquina;
      celula.classList.add(this._maquina.toLowerCase());

      if (this.verificarVencedor(this._maquina)) {
        this.finalizarJogo(false, '❌ Você perdeu!');
        return;
      }

      if (this.verificarEmpate()) {
        this.finalizarJogo(false, '⚠️ Empate! Tente de novo.');
        return;
      }
    }

    this._jogoAtivo = true;
    this.mensagem.textContent = 'Sua vez (X)';
  }

  verificarVencedor(jogador) {
    const combinacoesVitoria = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Linhas
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Colunas
      [0, 4, 8], [2, 4, 6]             // Diagonais
    ];

    return combinacoesVitoria.some(combinacao => {
      return combinacao.every(index => this._tabuleiro[index] === jogador);
    });
  }

  verificarEmpate() {
    return this._tabuleiro.every(celula => celula !== '');
  }

  finalizarJogo(venceu, textoMensagem) {
    this._jogoAtivo = false;
    this.mensagem.textContent = textoMensagem;

    if (venceu) {
      this._captchaResolvido = true;
      this.mensagem.style.color = '#2ecc71';
      this._habilitarTarget(true);

      // Dispara evento de sucesso
      this.dispatchEvent(new CustomEvent('captcha-resolved', { 
        detail: { metodo: 'jogo-da-velha' },
        bubbles: true,
        composed: true
      }));
    } else {
      this.mensagem.style.color = '#e74c3c';
      // Dispara evento de falha/expiração
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
if (!customElements.get('captcha-velha')) {
  customElements.define('captcha-velha', CaptchaVelhaElement);
}

export default CaptchaVelhaElement;