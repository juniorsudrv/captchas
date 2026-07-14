import React, { useState, useEffect, useRef } from 'react';
import './Login.css';
import 'captcha-jogodavelha';  

function Login_captcha_jogodavelha() {
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
            captchaValido: true // Apenas enviamos um booleano confirmando que passou
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
                    {/* Instanciando o novo componente do Jogo da Velha */}
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

export default Login_captcha_jogodavelha;