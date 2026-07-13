# 🕊️ Captcha Gospel (Web Component)

Um Web Component independente e reativo para validação de formulários (Captcha) com temática gospel. Funciona em React, Angular, Vue ou HTML puro.

---

## ⚙️ 1. Configuração do Repositório (Para o autor)

Para que este pacote possa ser instalado via NPM diretamente do GitHub, o repositório **precisa** ter um arquivo `package.json` na sua raiz. 

Se você é o dono do repositório, crie um arquivo chamado `package.json` junto com o seu `captcha-gospel.js` com o seguinte conteúdo:

{
  "name": "captcha-gospel",
  "version": "1.0.0",
  "description": "Web Component de Captcha Gospel",
  "main": "captcha-gospel.js",
  "files": [
    "captcha-gospel.js"
  ],
  "author": "Seu Nome",
  "license": "MIT"
}

---

## 📦 2. Instalação (Para quem vai usar)

No terminal do seu projeto front-end (ex: seu projeto React), rode o seguinte comando para instalar o pacote diretamente do GitHub:

npm install git+https://github.com/juniorsudrv/captchas.git

Isso adicionará automaticamente a referência ao `package.json` do seu projeto.

---

## 🚀 3. Como usar no React

Após a instalação, basta importar o pacote uma única vez para registrar o Web Component no navegador e usá-lo em qualquer lugar do seu JSX.

### Exemplo de uso (`Login.jsx`):

import React, { useState, useEffect, useRef } from 'react';
import 'captcha-gospel'; // 👈 Importa e registra o componente globalmente

function Login() {
  const [botaoHabilitado, setBotaoHabilitado] = useState(false);
  const captchaRef = useRef(null);

  useEffect(() => {
    const captchaElement = captchaRef.current;
    if (!captchaElement) return;

    // Função disparada quando o usuário acerta a palavra
    const handleResolved = (event) => {
      console.log('Palavra correta:', event.detail.palavra);
      setBotaoHabilitado(true);
    };

    // Função disparada quando o tempo do captcha acaba
    const handleExpired = () => {
      setBotaoHabilitado(false);
      alert('O tempo do captcha expirou!');
    };

    // Escutando os eventos nativos do Web Component
    captchaElement.addEventListener('captcha-resolved', handleResolved);
    captchaElement.addEventListener('captcha-expired', handleExpired);

    return () => {
      captchaElement.removeEventListener('captcha-resolved', handleResolved);
      captchaElement.removeEventListener('captcha-expired', handleExpired);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Formulário enviado com sucesso!');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Acesso Seguro</h2>
      
      {/* Usando a tag HTML customizada */}
      <captcha-gospel
        ref={captchaRef}
        width="300"
        height="200"
        wordlist='["JESUS", "AMOR", "FÉ", "PAZ", "GRAÇA"]'
      />

      <br />
      <button type="submit" disabled={!botaoHabilitado}>
        {botaoHabilitado ? 'Entrar' : 'Resolva o Captcha'}
      </button>
    </form>
  );
}

export default Login;

---

## 🎛️ Propriedades (Atributos)

Você pode customizar o `<captcha-gospel>` passando os seguintes atributos na tag HTML:

| Atributo | Tipo | Padrão | Descrição |
| :--- | :--- | :--- | :--- |
| `width` | String | `"300"` | Largura do canvas em pixels. |
| `height` | String | `"300"` | Altura do canvas em pixels. |
| `wordlist` | String (JSON) | *(Lista padrão)* | Array de palavras no formato JSON (ex: `["LUZ", "VIDA"]`). |
| `target` | String | `null` | (Opcional) ID do botão que o componente deve habilitar. *Nota: No React, prefira usar controle de state em vez do target.* |

---

## ⚡ Eventos Disparados

O componente emite eventos customizados (`CustomEvent`) que podem ser interceptados:

*   **`captcha-resolved`**: Disparado quando o usuário digita a palavra corretamente. 
    *   *Payload:* `event.detail.palavra`
*   **`captcha-expired`**: Disparado após inatividade, exigindo que o usuário clique em recarregar.

---

## 🔄 Atualizando o pacote
Caso aja alterações no código lá no GitHub e quiser puxar as novidades para o seu projeto local, basta rodar:

npm update captcha-gospel