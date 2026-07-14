import React, { useState, useEffect, useRef } from 'react';
import './Login.css';
import 'captcha-gospel'; // O Web Component é registrado globalmente aqui

function Login_captcha_gospel() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [botaoHabilitado, setBotaoHabilitado] = useState(false);
    const [captchaExpirado, setCaptchaExpirado] = useState(false);
    const captchaRef = useRef(null);
    const [palavraCaptcha, setPalavraCaptcha] = useState('');

    // 1. A função de login fica FORA do useEffect
    const handleLogin = async (e) => {
        e.preventDefault();
        
        const payload = {
            email,
            senha,
            captchaWord: palavraCaptcha 
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

        // 2. Agora o 'event' é recebido corretamente
        const handleCaptchaResolved = (event) => {
            setBotaoHabilitado(true);
            setCaptchaExpirado(false);
            setPalavraCaptcha(event.detail?.palavra);
        };

        const handleCaptchaExpired = () => {
            setCaptchaExpirado(true);
            setBotaoHabilitado(false);
        };

        captchaElement.addEventListener('captcha-resolved', handleCaptchaResolved);
        captchaElement.addEventListener('captcha-expired', handleCaptchaExpired);

        return () => {
            captchaElement.removeEventListener('captcha-resolved', handleCaptchaResolved);
            captchaElement.removeEventListener('captcha-expired', handleCaptchaExpired);
        };
    }, []);

    return (
        <div className="login-container">
            {/* 3. Conecte o form à função handleLogin */}
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
                
                <div style={{ margin: '10px 0' }}>
                    <captcha-gospel
                        ref={captchaRef}
                        width="300"
                        height="200"
                        wordlist='["JESUS","AMOR","FÉ","PAZ","GRAÇA","ALELUIA","GLORIA"]'
                    />
                    {captchaExpirado && (
                        <p style={{ color: '#e67e22', fontSize: '14px', margin: '5px 0 0 0' }}>
                            ⏳ Captcha expirou!
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={!botaoHabilitado}
                    style={{ opacity: botaoHabilitado ? 1 : 0.6, cursor: botaoHabilitado ? 'pointer' : 'not-allowed' }}
                >
                    {botaoHabilitado ? '✅ Entrar' : '🔒 Complete o captcha'}
                </button>
            </form>
        </div>
    );
}

export default Login_captcha_gospel;