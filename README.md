# 🛡️ Captchas Prod

Uma coleção de **CAPTCHAs interativos e criativos** desenvolvida para validar formulários de maneira divertida e segura.

A biblioteca é construída utilizando **Web Components**, tornando-a totalmente independente de framework e compatível com:

- ✅ React
- ✅ Angular
- ✅ Vue
- ✅ HTML puro
- ✅ Svelte
- ✅ Lit
- ✅ Qualquer framework que suporte Custom Elements

---

# 🎯 Captchas disponíveis

---

* 🎮 **Jogo da Velha (`<captcha-velha>`)**: Vença uma partida contra a máquina.
* 🦖 **Dino Runner (`<captcha-dino>`)**: Sobreviva por 10 segundos desviando de obstáculos.
* 🧠 **Jogo da Memória (`<captcha-memory>`)**: Encontre todos os pares de emojis ocultos.
* 🐭 **Labirinto (`<captcha-maze>`)**: Arraste o caminho correto do rato até o queijo.
* 🥤 **Copos / Shell Game (`<captcha-cups>`)**: Acompanhe o embaralhamento e descubra onde está a bolinha.
* 🏃 **Pique-Pega (`<captcha-tag>`)**: Persiga e clique no personagem fujão antes que o tempo acabe.
* ✊ **Pedra, Papel ou Tesoura (`<captcha-rps>`)**: Vença uma rodada do clássico Jokenpô contra o Robô.
* 🎯 **Estilingue (`<captcha-slingshot>`)**: Arraste, mire e acerte o alvo com física real.
* 🎵 **Genius / Simon Says (`<captcha-simon>`)**: Memorize e repita a sequência de cores e sons.
* 🕊️ **Gospel (`<captcha-gospel>`)**: Validação baseada em perguntas e temas cristãos.

---

# 📦 Instalação

Como o pacote está hospedado no GitHub, basta instalar utilizando o npm.

```bash
npm install git+https://github.com/juniorsudrv/captchas.git
```

ou adicionar ao seu `package.json`.

---

# 🧪 Projeto de Testes

O repositório possui um projeto React pronto para testar todos os captchas.

Entre na pasta:

```bash
cd testes-login
```

Instale as dependências:

```bash
npm install
```

Instale a biblioteca:

```bash
npm install git+https://github.com/juniorsudrv/captchas.git
```

Execute:

```bash
npm start
```

A aplicação será aberta em:

```
http://localhost:3000
```

---

# 🎮 Captcha Jogo da Velha

O componente utiliza Web Components e dispara dois eventos.

| Evento | Descrição |
|---------|-----------|
| `captcha-resolved` | Usuário venceu a partida |
| `captcha-failed` | Usuário perdeu ou empatou |

## Exemplo React

```jsx
import React, { useState, useEffect, useRef } from 'react';
import 'captchas-prod';

export default function Login() {

    const captchaRef = useRef(null);

    const [captchaOk, setCaptchaOk] = useState(false);

    useEffect(() => {

        const captcha = captchaRef.current;

        const sucesso = (event) => {
            console.log(event.detail.metodo);
            setCaptchaOk(true);
        };

        const erro = () => {
            setCaptchaOk(false);
        };

        captcha.addEventListener("captcha-resolved", sucesso);
        captcha.addEventListener("captcha-failed", erro);

        return () => {
            captcha.removeEventListener("captcha-resolved", sucesso);
            captcha.removeEventListener("captcha-failed", erro);
        };

    }, []);

    return (
        <>
            <captcha-velha ref={captchaRef}></captcha-velha>

            <button disabled={!captchaOk}>
                Entrar
            </button>
        </>
    );

}
```

---

# 🦖 Captcha Dino Runner

O Captcha Dino também utiliza Web Components e pode ser usado em qualquer framework.

## Objetivo

O usuário deve sobreviver durante **10 segundos**, desviando dos obstáculos.

Caso consiga, o captcha será considerado válido.

---

## Eventos

| Evento | Descrição |
|---------|-----------|
| `captcha-resolved` | Sobreviveu por 10 segundos |
| `captcha-failed` | Colidiu com um obstáculo |

---

## Exemplo React

```jsx
import React, { useEffect, useRef, useState } from 'react';
import 'captchas-prod';

export default function Login(){

    const captchaRef = useRef(null);

    const [captchaOk, setCaptchaOk] = useState(false);

    useEffect(()=>{

        const captcha = captchaRef.current;

        const sucesso = (event)=>{
            console.log(event.detail.metodo);
            setCaptchaOk(true);
        };

        const erro = ()=>{
            setCaptchaOk(false);
        };

        captcha.addEventListener("captcha-resolved", sucesso);
        captcha.addEventListener("captcha-failed", erro);

        return ()=>{
            captcha.removeEventListener("captcha-resolved", sucesso);
            captcha.removeEventListener("captcha-failed", erro);
        }

    },[]);

    return (
        <>
            <captcha-dino ref={captchaRef}></captcha-dino>

            <button disabled={!captchaOk}>
                Entrar
            </button>
        </>
    );

}
```

---

## Utilizando o atributo `target`

O componente pode habilitar automaticamente qualquer botão.

Basta informar um seletor CSS.

```html
<button id="btnLogin" disabled>
    Entrar
</button>

<captcha-dino target="#btnLogin"></captcha-dino>
```

Após a validação, o botão será habilitado automaticamente.

---

## Controles

| Ação | Função |
|------|--------|
| Clique | Inicia o jogo |
| Clique durante o jogo | Pular |
| Barra de Espaço | Pular |
| Touch | Compatível |

---

## Como funciona

1. Clique para iniciar.
2. O dinossauro começa a correr.
3. Pule os obstáculos.
4. Sobreviva por 10 segundos.
5. O evento `captcha-resolved` será disparado.

Caso colida com um obstáculo, será disparado o evento `captcha-failed`.

---

# 🕊️ Captcha Gospel

O Captcha Gospel também é implementado utilizando Web Components.

Pode ser utilizado em:

- React
- Angular
- Vue
- HTML puro

Eventos disponíveis:

| Evento | Descrição |
|---------|-----------|
| `captcha-resolved` | Respondeu corretamente |
| `captcha-failed` | Resposta incorreta |

Em breve serão adicionados exemplos completos.

---

# 🌎 Compatibilidade

Todos os componentes desta biblioteca utilizam **Web Components**, portanto funcionam em praticamente qualquer tecnologia frontend.

- ✅ React
- ✅ Angular
- ✅ Vue
- ✅ Next.js
- ✅ Vite
- ✅ Svelte
- ✅ HTML puro

---

# 📡 Eventos

Todos os captchas seguem o mesmo padrão de integração.

### Captcha Resolvido

```javascript
element.addEventListener("captcha-resolved", (event)=>{
    console.log(event.detail.metodo);
});
```

### Captcha Falhou

```javascript
element.addEventListener("captcha-failed", ()=>{
    console.log("Falhou");
});
```

---

# ⚙️ Scripts

Dentro da pasta de testes você pode utilizar:

## Iniciar

```bash
npm start
```

## Executar testes

```bash
npm test
```

## Build

```bash
npm run build
```

## Ejetar configuração

```bash
npm run eject
```

 

# 📄 Licença

Este projeto é distribuído sob a licença definida neste repositório GitHub.

Contribuições são sempre bem-vindas!