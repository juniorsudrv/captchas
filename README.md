# 🛡️ Captchas Prod
 
Uma coleção de CAPTCHAs interativos e criativos desenvolvida para validar formulários de maneira divertida e segura. O projeto utiliza **Web Components**, o que significa que é independente de framework e funciona perfeitamente em **React, Angular, Vue ou HTML puro**.

Atualmente, a biblioteca conta com:
- **Captcha Jogo da Velha**: O usuário precisa vencer uma partida de Jogo da Velha contra a máquina para provar que é humano.
- **Captcha Gospel**: Validação baseada em temas cristãos e passagens bíblicas.

---

## 📦 Instalação

Como o pacote está hospedado no GitHub, você pode instalá-lo diretamente via npm executando o comando abaixo no seu terminal:

```bash
npm install git+https://github.com/juniorsudrv/captchas.git
```

Sua configuração no arquivo `package.json` será atualizada automaticamente para incluir a dependência.

---

## 🧪 Como testar localmente (Projeto de Teste)

O repositório já inclui um projeto pronto para você testar a integração dos captchas em uma tela de login real. Para rodar o ambiente de testes na sua máquina, siga os passos:

1. Entre na pasta de testes:
   ```bash
   cd testes-login
   ```
2. Instale as dependências do projeto e a biblioteca de captchas:
   ```bash
   npm i
   npm install git+https://github.com/juniorsudrv/captchas.git
   ```
3. Inicie o servidor:
   ```bash
   npm start
   ```
Isso abrirá uma aplicação React no seu navegador onde você poderá interagir com o Captcha funcionando na prática!

---

## 🚀 Como Usar: Captcha Jogo da Velha

O componente `<captcha-velha>` emite dois eventos personalizados que você pode escutar no seu framework favorito:
- `captcha-resolved`: Disparado quando o usuário ganha o jogo.
- `captcha-failed`: Disparado quando o usuário perde ou empata.

### Exemplo de Integração com React

Abaixo está um exemplo completo de como importar e utilizar o Captcha Jogo da Velha em uma tela de Login usando React:

```jsx
import React, { useState, useEffect, useRef } from 'react';
import './Login.css';
// Importa a biblioteca de captchas para registrar os Web Components
import 'captchas-prod'; 

function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [botaoHabilitado, setBotaoHabilitado] = useState(false);
    const [captchaFalhou, setCaptchaFalhou] = useState(false);
    
    // Referência para o Web Component
    const captchaRef = useRef(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        
        const payload = {
            email,
            senha,
            captchaValido: true
        };

        const response = await fetch('[https://jsonplaceholder.typicode.com/posts](https://jsonplaceholder.typicode.com/posts)', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-type': 'application/json; charset=UTF-8' },
        });

        const data = await response.json();
        console.log("Enviado para o backend:", data);
        alert("Login enviado! Verifique o console.");
    };

    useEffect(() => {
        const captchaElement = captchaRef.current;
        if (!captchaElement) return;

        // Funções de callback para os eventos do Captcha
        const handleCaptchaResolved = (event) => {
            setBotaoHabilitado(true);
            setCaptchaFalhou(false);
            console.log("Captcha resolvido via:", event.detail.metodo);
        };

        const handleCaptchaFailed = () => {
            setCaptchaFalhou(true);
            setBotaoHabilitado(false);
        };

        // Escuta os eventos disparados pelo Web Component <captcha-velha>
        captchaElement.addEventListener('captcha-resolved', handleCaptchaResolved);
        captchaElement.addEventListener('captcha-failed', handleCaptchaFailed);

        return () => {
            captchaElement.removeEventListener('captcha-resolved', handleCaptchaResolved);
            captchaElement.removeEventListener('captcha-failed', handleCaptchaFailed);
        };
    }, []);

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleLogin}>
                <h2>Login</h2>
                <input
                    type="email"
                    placeholder="E-mail"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Senha"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                />
                
                <div style={{ margin: '15px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Instanciando o Web Component do Jogo da Velha */}
                    <captcha-velha ref={captchaRef}></captcha-velha>
                    
                    {captchaFalhou && (
                        <p style={{ color: '#e74c3c', fontSize: '14px', margin: '8px 0 0 0', fontWeight: 'bold' }}>
                            ❌ Você perdeu ou empatou! Reinicie o jogo.
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={!botaoHabilitado}
                    style={{ 
                        opacity: botaoHabilitado ? 1 : 0.6, 
                        cursor: botaoHabilitado ? 'pointer' : 'not-allowed',
                        width: '100%',
                        padding: '10px',
                        fontSize: '16px'
                    }}
                >
                    {botaoHabilitado ? '✅ Entrar' : '🔒 Vença o jogo para entrar'}
                </button>
            </form>
        </div>
    );
}

export default Login;
```

---

## 🕊️ Captcha Gospel

O **Captcha Gospel** também funciona via Web Components e pode ser integrado da mesma forma. *(Adicione aqui exemplos de uso caso as tags ou eventos possuam nomes diferentes)*.

---

## ⚙️ Create React App / Available Scripts

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

In the project directory, you can run:

### `npm start`
Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`
Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`
Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance. The build is minified and the filenames include the hashes.

### `npm run eject`
**Note: this is a one-way operation. Once you `eject`, you can't go back!**
If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

## Learn More
You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).