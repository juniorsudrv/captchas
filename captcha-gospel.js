// captcha-gospel.js
// Web Component independente - funciona em React, Angular, Vue, HTML puro

class CaptchaGospelElement extends HTMLElement {
  // Propriedades observadas para reatividade
  static get observedAttributes() {
    return ['width', 'height', 'target', 'wordlist'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._palavraAtual = '';
    this._captchaResolvido = false;
    this._timeoutId = null;
    this._elementoParaHabilitar = null;
  }

  // ===== CONFIGURAÇÕES =====
  get PALAVRAS_GOSPEL() {
    const attr = this.getAttribute('wordlist');
    if (attr) {
      try {
        return JSON.parse(attr);
      } catch (e) {
        return attr.split(',').map(p => p.trim());
      }
    }
    return [
      'JESUS', 'CRISTO', 'AMOR', 'FÉ', 'ESPIRITO', 'SALVACAO',
      'GRAÇA', 'PAZ', 'ALELUIA', 'GLORIA', 'REINO', 'VIDA',
      'LUZ', 'VERDADE', 'CAMINHO', 'RESSURREICAO', 'EVANGELHO',
      'ORACAO', 'ADORACAO', 'BONDADE', 'MISERICORDIA', 'SALVADOR'
    ];
  }

  get TEMPO_EXPIRACAO() { return 120000; }
  get NUM_ITENS_FUNDO() { return 150; }

  get CORES_FUNDO() {
    return ['#3498db','#e74c3c','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#2980b9','#c0392b','#27ae60','#8e44ad','#16a085'];
  }

  get CORES_TEXTO() {
    return ['#ffffff','#ecf0f1','#bdc3c7','#95a5a6'];
  }

  get SIMBOLOS_GOSPEL() {
    return [
      '✝', '☦', '✚', '†', '‡', '★', '☆', '✦', '✧',
      '♥', '❤', '❥', '☧', '🕊', '☮', '✙', '⛪', '✠', '☨', '♱',
      '∆', '∇', '∞', '⚜', '❀', '✿', '❁', '🌸', '🌺',
      '☀', '☁', '☂', '☃', '☄', '⌛', '⌚', '⌨', '⏳',
      '☚', '☛', '☜', '☝', '☞', '☟',
      '♩', '♪', '♫', '♬', '♭', '♮', '♯',
      '✪', '✫', '✬', '✭', '✮', '✯', '✰',
      '❂', '❃', '❄', '❅', '❆', '❇', '❈', '❉', '❊', '❋'
    ];
  }

  // ===== LIFECYCLE =====
  connectedCallback() {
    this.render();
    this.iniciar();
  }

  disconnectedCallback() {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.isConnected) {
      this.iniciar();
    }
  }

  // ===== RENDER =====
  render() {
    const largura = this.getAttribute('width') || '300';
    const altura = this.getAttribute('height') || '300';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: Arial, sans-serif;
        }
        .captcha-container {
          display: inline-block;
        }
        canvas {
          display: block;
          border-radius: 4px;
        }
        .controls {
          display: flex;
          gap: 0;
          margin-top: 0;
        }
        .controls input {
          border: none;
          outline: none;
          padding: 0;
          margin: 0;
          font-size: 16px;
          width: 200px;
          height: 40px;
          background: #f0f0f0;
          text-align: center;
          display: inline-block;
        }
        .controls button {
          border: none;
          outline: none;
          padding: 0;
          margin: 0;
          font-size: 24px;
          width: 40px;
          height: 40px;
          cursor: pointer;
          display: inline-block;
          vertical-align: top;
          background: #3498db;
          color: white;
        }
        .controls .reload-btn {
          background: #95a5a6;
        }
        .mensagem {
          display: block;
          font-size: 40px;
          margin: 5px 0 0 0;
          padding: 0;
          height: 50px;
          text-align: center;
        }
      </style>
      <div class="captcha-container">
        <canvas width="${largura}" height="${altura}"></canvas>
        <div class="controls">
          <input type="text" placeholder="Digite a palavra" />
          <button class="verify-btn">✓</button>
          <button class="reload-btn">↻</button>
        </div>
        <div class="mensagem"></div>
      </div>
    `;

    // Referências
    this.canvas = this.shadowRoot.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.input = this.shadowRoot.querySelector('input');
    this.verifyBtn = this.shadowRoot.querySelector('.verify-btn');
    this.reloadBtn = this.shadowRoot.querySelector('.reload-btn');
    this.mensagem = this.shadowRoot.querySelector('.mensagem');

    // Eventos
    this.verifyBtn.addEventListener('click', () => this.verificar());
    this.reloadBtn.addEventListener('click', () => this.recarregar());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.verificar();
    });
  }

  // ===== LÓGICA PRINCIPAL =====
  iniciar() {
    if (!this.canvas) return;
    this.desenharCaptcha();
  }

  recarregar() {
    if (this.canvas) {
      this.desenharCaptcha();
    }
  }

  gerarPalavra() {
    const lista = this.PALAVRAS_GOSPEL;
    return lista[Math.floor(Math.random() * lista.length)];
  }

  desenharCaptcha() {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }

    this._palavraAtual = this.gerarPalavra();
    this._captchaResolvido = false;

    const largura = parseInt(this.getAttribute('width')) || 300;
    const altura = parseInt(this.getAttribute('height')) || 300;
    this.canvas.width = largura;
    this.canvas.height = altura;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, largura, altura);

    // Fundo
    const corFundo = this.CORES_FUNDO[Math.floor(Math.random() * this.CORES_FUNDO.length)];
    ctx.fillStyle = corFundo;
    ctx.fillRect(0, 0, largura, altura);

    // Linhas de ruído
    this.desenharLinhasRuido(ctx, largura, altura);

    // Símbolos e letras
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const todosCaracteres = letras + this.SIMBOLOS_GOSPEL.join('');
    for (let i = 0; i < this.NUM_ITENS_FUNDO; i++) {
      const posX = Math.random() * largura;
      const posY = Math.random() * altura;
      const item = todosCaracteres[Math.floor(Math.random() * todosCaracteres.length)];
      const tamanho = 10 + Math.random() * 20;
      const cor = this.CORES_TEXTO[Math.floor(Math.random() * this.CORES_TEXTO.length)];
      ctx.fillStyle = cor;
      ctx.globalAlpha = 0.3 + Math.random() * 0.3;
      ctx.font = `${tamanho}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item, posX, posY);
    }
    ctx.globalAlpha = 1.0;

    // Palavra com distorção
    this.desenharPalavraComDistorcao(ctx, largura, altura);

    this.mensagem.textContent = '';
    this.input.disabled = false;
    this.verifyBtn.disabled = false;

    // Habilita target se existir
    this._habilitarTarget(false);

    // Expiração
    this._timeoutId = setTimeout(() => {
      if (!this._captchaResolvido) {
        this.mensagem.textContent = '⏳';
        this.mensagem.style.color = '#e67e22';
        this._palavraAtual = null;
        // Dispara evento de expiração
        this.dispatchEvent(new CustomEvent('captcha-expired', {
          bubbles: true,
          composed: true
        }));
      }
    }, this.TEMPO_EXPIRACAO);
  }

  desenharLinhasRuido(ctx, largura, altura) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * largura, Math.random() * altura);
      ctx.lineTo(Math.random() * largura, Math.random() * altura);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  desenharPalavraComDistorcao(ctx, largura, altura) {
    const palavra = this._palavraAtual;
    if (!palavra) return;

    const tamanhoFonte = Math.min(30, largura / palavra.length * 0.7);
    const tamanho = Math.max(18, tamanhoFonte);
    ctx.font = `bold ${tamanho}px Arial`;
    const metrica = ctx.measureText(palavra);
    const larguraPalavra = metrica.width;
    const alturaPalavra = tamanho;

    const margem = 20;
    const limiteXMin = margem + larguraPalavra/2;
    const limiteXMax = largura - margem - larguraPalavra/2;
    const limiteYMin = margem + alturaPalavra/2;
    const limiteYMax = altura - margem - alturaPalavra/2;
    const posX = limiteXMin + Math.random() * (limiteXMax - limiteXMin);
    const posY = limiteYMin + Math.random() * (limiteYMax - limiteYMin);
    const angulo = (Math.random() - 0.5) * Math.PI / 3;

    ctx.save();
    ctx.translate(posX, posY);
    ctx.rotate(angulo);

    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    const caracteres = palavra.split('');
    const espacamento = ctx.measureText('M').width * 0.6;
    const larguraTotal = (caracteres.length - 1) * espacamento;
    const inicioX = -larguraTotal / 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';

    for (let i = 0; i < caracteres.length; i++) {
      const char = caracteres[i];
      const x = inicioX + i * espacamento;
      const offsetY = Math.sin(i * 0.8 + Date.now() / 2000) * 4;
      ctx.fillText(char, x, offsetY);
    }

    ctx.restore();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  verificar() {
    if (!this._palavraAtual) {
      this.mensagem.textContent = '⏳';
      this.mensagem.style.color = '#e67e22';
      // Dispara evento de expirado
      this.dispatchEvent(new CustomEvent('captcha-expired', {
        bubbles: true,
        composed: true
      }));
      return;
    }

    if (this._captchaResolvido) {
      this.mensagem.textContent = '✅';
      this.mensagem.style.color = '#2ecc71';
      return;
    }

    const resposta = this.input.value.trim();
    if (resposta === '') {
      this.mensagem.textContent = '⚠️';
      this.mensagem.style.color = '#f39c12';
      return;
    }

    if (resposta.toLowerCase() === this._palavraAtual.toLowerCase()) {
      this._captchaResolvido = true;
      this.mensagem.textContent = '✅';
      this.mensagem.style.color = '#2ecc71';
      this.input.disabled = true;
      this.verifyBtn.disabled = true;
      this._habilitarTarget(true);
      
      // 🔥 DISPARA EVENTO COM composed: true
      this.dispatchEvent(new CustomEvent('captcha-resolved', { 
        detail: { palavra: this._palavraAtual },
        bubbles: true,
        composed: true
      }));
    } else {
      this.mensagem.textContent = '❌';
      this.mensagem.style.color = '#e74c3c';
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
if (!customElements.get('captcha-gospel')) {
  customElements.define('captcha-gospel', CaptchaGospelElement);
}

export default CaptchaGospelElement;