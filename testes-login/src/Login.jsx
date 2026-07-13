import React, { useState } from 'react';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    console.log("Dados:", { email, senha });
    alert("Login enviado!");
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Login</h2>
        <input 
          type="email" placeholder="E-mail" required 
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" placeholder="Senha" required 
          onChange={(e) => setSenha(e.target.value)} 
        />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

export default Login;