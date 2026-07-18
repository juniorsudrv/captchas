import React, { useState } from 'react';
import './MenuCaptcha.css';

// Importe seus componentes de login aqui
import Login_captcha_gospel from './Login_captcha_gospel';

import Login_captcha_jogodavelha from './Login_captcha_jogodavelha';
import Login_captcha_dino from './Login_captcha_dino';
import Login_captcha_memory  from './Login_captcha_memory';
import Login_captcha_maze from './Login_captcha_maze'; 
import Login_captcha_cups from './Login_captcha_cups';
import Login_captcha_tag from './Login_captcha_tag';
import Login_captcha_rps from './Login_captcha_rps';
import Login_captcha_slingshot from './Login_captcha_slingshot';
import Login_captcha_simon from './Login_captcha_simon';

function MenuCaptcha() {
  const [activeLogin, setActiveLogin] = useState(null);

  // Lista de logins disponíveis
  const loginOptions = [
    {
      id: 'gospel',
      name: 'Login Captcha-Gospel',
      component: Login_captcha_gospel,
      description: 'Login com tema gospel e captcha'
    },
    {
      id: 'social',
      name: 'Login Captcha-JogoDaVelha',
      component: Login_captcha_jogodavelha, // Substitua pelo componente real
      description: 'Login com redes sociais e captcha'
    } ,
    {
      id: 'dino',
      name: 'Login Captcha-Dino',
      component: Login_captcha_dino, // Substitua pelo componente real
      description: 'Login com redes sociais e captcha'
    }  ,
    {
      id: 'memory',
      name: 'Login Captcha-Memória',
      component: Login_captcha_memory, // Substitua pelo componente real
      description: 'Login com redes sociais e captcha'
    } 
    ,
    {
      id: 'maze',
      name: 'Login Captcha-Labirinto',
      component: Login_captcha_maze, // Substitua pelo componente real
      description: 'Login com redes sociais e captcha'
    } ,
    {
      id: 'cups',
      name: 'Login Captcha-JogoDasConchas',
      component: Login_captcha_cups, // Substitua pelo componente real
      description: 'Login com redes sociais e captcha'
    } 
    ,
    {
      id: 'gas',
      name: 'Login Captcha-PiquePega',
      component: Login_captcha_tag, // Substitua pelo componente real
      description: 'Login com redes sociais e captcha'
    } 
    ,
    {
      id: 'rps',
      name: 'Login Captcha-PedraPaelTesoura',
      component: Login_captcha_rps, // Substitua pelo componente real
      description: 'Login com redes sociais e captcha'
    }  ,
    {
      id: 'slingshot',
      name: 'Login Captcha-AngryBirds',
      component: Login_captcha_slingshot, // Substitua pelo componente real
      description: 'Login com redes sociais e captcha'
    } ,
    {
      id: 'simon',
      name: 'Login Captcha-MemoriaCoresSons',
      component: Login_captcha_simon, // Substitua pelo componente real
      description: 'Login com redes sociais e captcha'
    } 
  ];

  const handleLoginClick = (loginId) => {
    setActiveLogin(activeLogin === loginId ? null : loginId);
  };

  const handleBackToMenu = () => {
    setActiveLogin(null);
  };

  // Se nenhum login estiver ativo, mostra o menu
  if (!activeLogin) {
    return (
      <div className="menu-container">
        <h1 className="menu-title">Sistema de Login com Captcha</h1>
        <p className="menu-subtitle">Selecione o tipo de login para demonstração:</p>
        
        <div className="menu-grid">
          {loginOptions.map((option) => (
            <button
              key={option.id}
              className="menu-button"
              onClick={() => handleLoginClick(option.id)}
            >
              <span className="button-icon">🔐</span>
              <span className="button-name">{option.name}</span>
              <span className="button-description">{option.description}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Se um login estiver ativo, mostra o componente correspondente
  const ActiveComponent = loginOptions.find(option => option.id === activeLogin)?.component;

  return (
    <div className="login-demo-container">
      <button className="back-button" onClick={handleBackToMenu}>
        ← Voltar ao Menu
      </button>
      
      {ActiveComponent ? (
        <ActiveComponent />
      ) : (
        <div className="placeholder-login">
          <h2>Em desenvolvimento</h2>
          <p>Este login ainda não foi implementado</p>
          <button className="back-button" onClick={handleBackToMenu}>
            Voltar ao Menu
          </button>
        </div>
      )}
    </div>
  );
}

export default MenuCaptcha;