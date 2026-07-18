// captcha-maze.js
// Web Component independente - funciona em React, Angular, Vue, HTML puro

class CaptchaMazeElement extends HTMLElement {
  static get observedAttributes() {
    return ['target'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Configurações do Labirinto
    this._cols = 8;
    this._rows = 8;
    this._cellSize = 30;
    this._grid = [];
    this._path = [];
    
    // Estado
    this._isDragging = false;
    this._captchaResolvido = false;
    this._mazeWidth = this._cols * this._cellSize;
    this._mazeHeight = this._rows * this._cellSize;

    this.iniciar = this.iniciar.bind(this);
    this.desenhar = this.desenhar.bind(this);
    this.handleStart = this.handleStart.bind(this);
    this.handleMove = this.handleMove.bind(this);
    this.handleEnd = this.handleEnd.bind(this);
  }

  // ===== LIFECYCLE =====
  connectedCallback() {
    this.render();
    
    // Referências do DOM
    this.canvas = this.shadowRoot.getElementById('maze-canvas');
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
        this.iniciar();
    });

    // Eventos de arraste (Mouse e Touch)
    this.canvas.addEventListener('mousedown', this.handleStart);
    this.canvas.addEventListener('mousemove', this.handleMove);
    window.addEventListener('mouseup', this.handleEnd); // Window para caso solte fora do canvas

    this.canvas.addEventListener('touchstart', this.handleStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleMove, { passive: false });
    window.addEventListener('touchend', this.handleEnd);

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
          background-color: #fff;
          border-radius: 4px;
          border: 2px solid #bdc3c7;
          display: flex;
          justify-content: center;
          align-items: center;
          touch-action: none; /* Previne scroll no celular ao jogar */
        }
        canvas {
          display: block;
          cursor: crosshair;
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
        <div class="header">Arraste o rato até o queijo para provar que é humano</div>
        
        <div class="game-area">
          <canvas id="maze-canvas" width="${this._mazeWidth}" height="${this._mazeHeight}"></canvas>
          <div id="overlay" class="overlay">Clique para começar</div>
        </div>

        <div class="controls">
          <div class="mensagem" id="mensagem">Aguardando...</div>
          <button class="reload-btn" id="reload" title="Reiniciar">↻</button>
        </div>
      </div>
    `;
  }

  // ===== GERAÇÃO DO LABIRINTO (Recursive Backtracker) =====
  gerarLabirinto() {
    this._grid = [];
    for (let r = 0; r < this._rows; r++) {
      let row = [];
      for (let c = 0; c < this._cols; c++) {
        // walls: [Top, Right, Bottom, Left]
        row.push({ c, r, walls: [true, true, true, true], visited: false });
      }
      this._grid.push(row);
    }

    const stack = [];
    let current = this._grid[0][0];
    current.visited = true;

    // Loop de geração
    while (true) {
      let vizinhos = this.obterVizinhosNaoVisitados(current);

      if (vizinhos.length > 0) {
        let proximo = vizinhos[Math.floor(Math.random() * vizinhos.length)];
        stack.push(current);
        this.removerParedes(current, proximo);
        proximo.visited = true;
        current = proximo;
      } else if (stack.length > 0) {
        current = stack.pop();
      } else {
        break;
      }
    }
  }

  obterVizinhosNaoVisitados(celula) {
    let vizinhos = [];
    let { c, r } = celula;

    if (r > 0 && !this._grid[r - 1][c].visited) vizinhos.push(this._grid[r - 1][c]); // Top
    if (c < this._cols - 1 && !this._grid[r][c + 1].visited) vizinhos.push(this._grid[r][c + 1]); // Right
    if (r < this._rows - 1 && !this._grid[r + 1][c].visited) vizinhos.push(this._grid[r + 1][c]); // Bottom
    if (c > 0 && !this._grid[r][c - 1].visited) vizinhos.push(this._grid[r][c - 1]); // Left

    return vizinhos;
  }

  removerParedes(a, b) {
    let x = a.c - b.c;
    if (x === 1) { a.walls[3] = false; b.walls[1] = false; } // a é direita de b
    else if (x === -1) { a.walls[1] = false; b.walls[3] = false; } // a é esquerda de b

    let y = a.r - b.r;
    if (y === 1) { a.walls[0] = false; b.walls[2] = false; } // a é abaixo de b
    else if (y === -1) { a.walls[2] = false; b.walls[0] = false; } // a é acima de b
  }

  // ===== LÓGICA DO JOGO =====
  prepararJogo() {
    this._captchaResolvido = false;
    this._isDragging = false;
    this._path = [{ c: 0, r: 0 }]; // Começa na posição 0,0

    this.gerarLabirinto();
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
    this.mensagem.textContent = 'Encontre a saída...';
  }

  // ===== INTERAÇÕES DE ARRASTE =====
  obterPosicaoGrid(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    return {
      c: Math.floor(x / this._cellSize),
      r: Math.floor(y / this._cellSize)
    };
  }

  handleStart(e) {
    if (this._captchaResolvido || this.overlay.style.display === 'flex') return;
    if (e.cancelable) e.preventDefault(); // Previne scroll no touch

    const pos = this.obterPosicaoGrid(e);
    const atual = this._path[this._path.length - 1];

    // Só começa a arrastar se clicar na ponta atual do caminho
    if (pos.c === atual.c && pos.r === atual.r) {
      this._isDragging = true;
    }
  }

  handleMove(e) {
    if (!this._isDragging || this._captchaResolvido) return;
    if (e.cancelable) e.preventDefault();

    const pos = this.obterPosicaoGrid(e);
    
    // Garante que está dentro dos limites do grid
    if (pos.c < 0 || pos.c >= this._cols || pos.r < 0 || pos.r >= this._rows) return;

    const atual = this._path[this._path.length - 1];

    // Se moveu para uma célula diferente
    if (pos.c !== atual.c || pos.r !== atual.r) {
      
      // Verifica se está voltando pelo caminho (Backtracking)
      if (this._path.length > 1) {
        const anterior = this._path[this._path.length - 2];
        if (pos.c === anterior.c && pos.r === anterior.r) {
          this._path.pop(); // Remove o último passo
          this.desenhar();
          return;
        }
      }

      // Verifica se é um vizinho válido e se NÃO há parede entre eles
      if (this.movimentoValido(atual, pos)) {
        this._path.push({ c: pos.c, r: pos.r });
        this.desenhar();

        // Checa Vitória (chegou no canto inferior direito)
        if (pos.c === this._cols - 1 && pos.r === this._rows - 1) {
          this.finalizarJogo();
        }
      }
    }
  }

  handleEnd() {
    this._isDragging = false;
  }

  movimentoValido(de, para) {
    const dc = para.c - de.c;
    const dr = para.r - de.r;
    
    // Apenas movimentos cardeais de 1 casa por vez
    if (Math.abs(dc) + Math.abs(dr) !== 1) return false;

    const celulaAtual = this._grid[de.r][de.c];
    
    if (dr === -1 && !celulaAtual.walls[0]) return true; // Cima
    if (dc === 1 && !celulaAtual.walls[1]) return true;  // Direita
    if (dr === 1 && !celulaAtual.walls[2]) return true;  // Baixo
    if (dc === -1 && !celulaAtual.walls[3]) return true; // Esquerda

    return false;
  }

  // ===== DESENHO DO CANVAS =====
  desenhar() {
    const w = this._mazeWidth;
    const h = this._mazeHeight;
    const cs = this._cellSize;
    
    this.ctx.clearRect(0, 0, w, h);

    // Desenhar o Caminho do usuário
    if (this._path.length > 0) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = '#3498db';
      this.ctx.lineWidth = cs * 0.4;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      this.ctx.moveTo(
        this._path[0].c * cs + cs / 2, 
        this._path[0].r * cs + cs / 2
      );

      for (let i = 1; i < this._path.length; i++) {
        this.ctx.lineTo(
          this._path[i].c * cs + cs / 2, 
          this._path[i].r * cs + cs / 2
        );
      }
      this.ctx.stroke();
    }

    // Desenhar as paredes
    this.ctx.strokeStyle = '#2c3e50';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'square';

    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        let x = c * cs;
        let y = r * cs;
        let cell = this._grid[r][c];

        this.ctx.beginPath();
        if (cell.walls[0]) { this.ctx.moveTo(x, y); this.ctx.lineTo(x + cs, y); } // Top
        if (cell.walls[1]) { this.ctx.moveTo(x + cs, y); this.ctx.lineTo(x + cs, y + cs); } // Right
        if (cell.walls[2]) { this.ctx.moveTo(x + cs, y + cs); this.ctx.lineTo(x, y + cs); } // Bottom
        if (cell.walls[3]) { this.ctx.moveTo(x, y + cs); this.ctx.lineTo(x, y); } // Left
        this.ctx.stroke();
      }
    }

    // Desenhar Início (Rato) e Fim (Queijo)
    this.ctx.font = `${cs * 0.6}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Símbolo de Fim (Queijo no canto inferior direito)
    this.ctx.fillText('🧀', (this._cols - 1) * cs + cs / 2, (this._rows - 1) * cs + cs / 2);
    
    // Símbolo de Início (Rato - na ponta atual do caminho)
    const pontaAtual = this._path[this._path.length - 1];
    this.ctx.fillText('🐭', pontaAtual.c * cs + cs / 2, pontaAtual.r * cs + cs / 2 + 2);
  }

  // ===== CONCLUSÃO =====
  finalizarJogo() {
    this._captchaResolvido = true;
    this._isDragging = false;
    
    this.mensagem.textContent = '✅ Verificado!';
    this.mensagem.style.color = '#2ecc71';
    this._habilitarTarget(true);

    this.dispatchEvent(new CustomEvent('captcha-resolved', { 
      detail: { metodo: 'maze' },
      bubbles: true,
      composed: true
    }));
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
if (!customElements.get('captcha-maze')) {
  customElements.define('captcha-maze', CaptchaMazeElement);
}

export default CaptchaMazeElement;