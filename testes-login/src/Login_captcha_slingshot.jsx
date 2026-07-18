import React, { useState, useEffect, useRef } from 'react';
import './Login.css';
import 'captcha-slingshot';  

function Login_captcha_slingshot() { // Renomeei a função para refletir o novo jogo
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [botaoHabilitado, setBotaoHabilitado] = useState(false);
    const [captchaFalhou, setCaptchaFalhou] = useState(false);
    const captchaRef = useRef(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        
        const payload = {
            email,
            senha,
            captchaValido: true
        };

        const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
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

        const handleCaptchaResolved = (event) => {
            setBotaoHabilitado(true);
            setCaptchaFalhou(false);
            console.log("Captcha resolvido via:", event.detail?.metodo);
        };

        const handleCaptchaFailed = () => {
            setCaptchaFalhou(true);
            setBotaoHabilitado(false);
        };

        // Escuta os mesmos eventos, pois mantivemos o padrão no Web Component
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
                    
                    {/* Alterado para chamar o componente do Dinossauro */}
                    <captcha-slingshot  ref={captchaRef}></captcha-slingshot>
                    
                    {captchaFalhou && (
                        <p style={{ color: '#e74c3c', fontSize: '14px', margin: '8px 0 0 0', fontWeight: 'bold' }}>
                            ❌ Você bateu no cacto! Reinicie o jogo.
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
                    {/* Texto do botão ajustado para a nova temática */}
                    {botaoHabilitado ? '✅ Entrar' : '🔒 Sobreviva ao jogo para entrar'}
                </button>
            </form>
        </div>
    );
}

export default Login_captcha_slingshot;