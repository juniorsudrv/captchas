import React, { useState, useEffect, useRef } from 'react';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [captchaLoaded, setCaptchaLoaded] = useState(false);
  const [botaoHabilitado, setBotaoHabilitado] = useState(false);
  const captchaRef = useRef(null);

  // Carrega o Captcha Gospel
  useEffect(() => {
    import('https://cdn.jsdelivr.net/gh/juniorsudrv/captchas@main/captcha-gospel.js')
      .then(() => setCaptchaLoaded(true))
      .catch(err => console.error('Erro:', err));
  }, []);

  // Escuta o evento do captcha
  useEffect(() => {
    const captchaElement = captchaRef.current;
    if (!captchaElement) return;

    const handleCaptchaResolved = (event) => {
      console.log('🎉 Captcha resolvido! Palavra:', event.detail.palavra);
      setBotaoHabilitado(true);
    };

    captchaElement.addEventListener('captcha-resolved', handleCaptchaResolved);

    return () => {
      captchaElement.removeEventListener('captcha-resolved', handleCaptchaResolved);
    };
  }, [captchaLoaded]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!botaoHabilitado) {
      alert('⚠️ Complete o captcha primeiro!');
      return;
    }
    console.log("Dados:", { email, senha });
    alert("✅ Login enviado com sucesso!");
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Login</h2>
        <input 
          type="email" 
          placeholder="E-mail" 
          required 
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Senha" 
          required 
          onChange={(e) => setSenha(e.target.value)} 
        />

        {captchaLoaded && (
          <div style={{ margin: '10px 0' }}>
            <captcha-gospel 
              ref={captchaRef}
              width="300" 
              height="300"
              wordlist='["JESUS","AMOR","FÉ","PAZ","GRAÇA","ALELUIA","GLORIA"]'
            />
          </div>
        )}

        <button 
          type="submit" 
          disabled={!botaoHabilitado}
          style={{
            opacity: botaoHabilitado ? 1 : 0.6,
            cursor: botaoHabilitado ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease'
          }}
        >
          {botaoHabilitado ? '✅ Entrar' : '🔒 Complete o captcha'}
        </button>
      </form>
    </div>
  );
}

export default Login;