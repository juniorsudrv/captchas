import React, { useState, useMemo } from 'react';
import './MenuCaptcha.css';

// Importe seus componentes de login
import Login_captcha_gospel from './Login_captcha_gospel';
import Login_captcha_jogodavelha from './Login_captcha_jogodavelha';
import Login_captcha_dino from './Login_captcha_dino';
import Login_captcha_memory from './Login_captcha_memory';
import Login_captcha_maze from './Login_captcha_maze';
import Login_captcha_cups from './Login_captcha_cups';
import Login_captcha_tag from './Login_captcha_tag';
import Login_captcha_rps from './Login_captcha_rps';
import Login_captcha_slingshot from './Login_captcha_slingshot';
import Login_captcha_simon from './Login_captcha_simon';

function MenuCaptcha() {
  const [activeLogin, setActiveLogin] = useState(null);

  const loginOptions = useMemo(() => [
    {
      id: 'gospel',
      name: 'Gospel',
      icon: '🙏',
      color: '#4f46e5',
      component: Login_captcha_gospel,
      description: 'Login com tema gospel e versículos bíblicos'
    },
    {
      id: 'social',
      name: 'Jogo da Velha',
      icon: '⭕',
      color: '#10b981',
      component: Login_captcha_jogodavelha,
      description: 'Captcha clássico com Jogo da Velha'
    },
    {
      id: 'dino',
      name: 'Dino Runner',
      icon: '🦕',
      color: '#f59e0b',
      component: Login_captcha_dino,
      description: 'Captcha inspirado no Chrome Dino'
    },
    {
      id: 'memory',
      name: 'Jogo da Memória',
      icon: '🧠',
      color: '#8b5cf6',
      component: Login_captcha_memory,
      description: 'Captcha com pares de cartas'
    },
    {
      id: 'maze',
      name: 'Labirinto',
      icon: '🌀',
      color: '#ef4444',
      component: Login_captcha_maze,
      description: 'Captcha com navegação em labirinto'
    },
    {
      id: 'cups',
      name: 'Jogo das Conchas',
      icon: '🥥',
      color: '#14b8a6',
      component: Login_captcha_cups,
      description: 'Captcha estilo "Adivinhe onde está"'
    },
    {
      id: 'gas',
      name: 'Pique-Pega',
      icon: '🏃‍♂️',
      color: '#f97316',
      component: Login_captcha_tag,
      description: 'Captcha com perseguição'
    },
    {
      id: 'rps',
      name: 'Pedra, Papel e Tesoura',
      icon: '✊',
      color: '#6366f1',
      component: Login_captcha_rps,
      description: 'Captcha com o clássico Jokenpô'
    },
    {
      id: 'slingshot',
      name: 'AngryBirds(Estilingue)',
      icon: '🐦',
      color: '#dc2626',
      component: Login_captcha_slingshot,
      description: 'Captcha com lançamento de pássaros'
    },
    {
      id: 'simon',
      name: 'Memoria (Com Cores)',
      icon: '🎵',
      color: '#db2777',
      component: Login_captcha_simon,
      description: 'Captcha com sequência de cores e sons'
    }
  ], []);

  const handleLoginClick = (loginId) => {
    setActiveLogin(activeLogin === loginId ? null : loginId);
  };

  const handleBackToMenu = () => {
    setActiveLogin(null);
  };

  if (!activeLogin) {
    return (
      <div className="menu-container">
        <div className="menu-header">
          <h1 className="menu-title">🔐 Sistema de Login com Captcha</h1>
          <p className="menu-subtitle">
            Escolha um mini-jogo divertido para fazer o login
          </p>
        </div>

        <div className="menu-grid">
          {loginOptions.map((option) => (
            <button
              key={option.id}
              className="menu-card"
              onClick={() => handleLoginClick(option.id)}
              style={{ '--card-color': option.color }}
            >
              <div className="card-icon-wrapper">
                <span className="card-icon">{option.icon}</span>
              </div>
              <div className="card-content">
                <h3 className="card-name">{option.name}</h3>
                <p className="card-description">{option.description}</p>
              </div>
              <div className="card-arrow">→</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const ActiveComponent = loginOptions.find(
    (option) => option.id === activeLogin
  )?.component;

  return (
    <div className="login-demo-container">
      <button className="back-button" onClick={handleBackToMenu}>
        ← Voltar ao Menu
      </button>

      {ActiveComponent ? (
        <ActiveComponent onBack={handleBackToMenu} />
      ) : (
        <div className="placeholder-login">
          <h2>🚧 Em desenvolvimento</h2>
          <p>Este captcha ainda está sendo implementado.</p>
          <button className="back-button" onClick={handleBackToMenu}>
            Voltar ao Menu
          </button>
        </div>
      )}
    </div>
  );
}

export default MenuCaptcha;