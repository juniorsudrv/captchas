import React, { useState, useEffect, useRef } from 'react';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [captchaLoaded, setCaptchaLoaded] = useState(false);
  const [botaoHabilitado, setBotaoHabilitado] = useState(false);
  const [captchaExpirado, setCaptchaExpirado] = useState(false);
  const captchaRef = useRef(null);

  // Carrega o Captcha Gospel
  useEffect(() => {
    import('https://cdn.jsdelivr.net/gh/juniorsudrv/captchas@main/captcha-gospel.js')
      .then(() => {
        setCaptchaLoaded(true);
        console.log('✅ Captcha Gospel carregado!');
      })
      .catch(err => {
        console.error('❌ Erro ao carregar Captcha Gospel:', err);
      });
  }, []);

  // Escuta os eventos do captcha
  useEffect(() => {
    const captchaElement = captchaRef.current;
    if (!captchaElement) return;

    // Evento quando o captcha é resolvido
    const handleCaptchaResolved = (event) => {
      console.log('🎉 Captcha resolvido! Palavra:', event.detail?.palavra);
      setBotaoHabilitado(true);
      setCaptchaExpirado(false);
    };

    // Evento quando o captcha expira
    const handleCaptchaExpired = () => {
      console.log('⏳ Captcha expirou!');
      setCaptchaExpirado(true);
      setBotaoHabilitado(false);
    };

    captchaElement.addEventListener('captcha-resolved', handleCaptchaResolved);
    captchaElement.addEventListener('captcha-expired', handleCaptchaExpired);

    return () => {
      captchaElement.removeEventListener('captcha-resolved', handleCaptchaResolved);
      captchaElement.removeEventListener('captcha-expired', handleCaptchaExpired);
    };
  }, [captchaLoaded]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!botaoHabilitado) {
      alert(captchaExpirado ? '⏳ O captcha expirou! Clique em ↻ para recarregar.' : '⚠️ Complete o captcha primeiro!');
      return;
    }
    console.log("Dados:", { email, senha });
    alert("✅ Login enviado com sucesso!");
    // Reset após login
    setBotaoHabilitado(false);
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

        {captchaLoaded ? (
          <div style={{ margin: '10px 0' }}>
            <captcha-gospel 
              ref={captchaRef}
              width="300" 
              height="300"
              wordlist='["JESUS","AMOR","FÉ","PAZ","GRAÇA","ALELUIA","GLORIA"]'
            />
            {captchaExpirado && (
              <p style={{ color: '#e67e22', fontSize: '14px', margin: '5px 0 0 0' }}>
                ⏳ Captcha expirou! Clique em ↻ para recarregar.
              </p>
            )}
          </div>
        ) : (
          <div style={{ margin: '10px 0', padding: '20px', background: '#f0f0f0', textAlign: 'center' }}>
            ⏳ Carregando captcha...
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