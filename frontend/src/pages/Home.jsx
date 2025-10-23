import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import coffeeGrenade from '../assets/coffee-grenade.png';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="hero-left">
        <div className="hero-content">
          <h1 className="brand-title">Grind</h1>
          <h3 className="brand-subtitle">CAFFEINE WITHOUT COMPROMISE</h3>
          <h4 className="brand-tag">COMBAT READY COFFEE</h4>

          <div className="button-group">
            <button
              className="btn-primary"
              onClick={() => navigate('/order')}
            >
              DEPLOY DARK ROAST
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate('/menu')}
            >
              COFFEE COMBAT MENU
            </button>
          </div>
        </div>
      </div>

      <div className="hero-right">
        <img src={coffeeGrenade} alt="Coffee grenade splash" className="hero-image" />
      </div>
    </div>
  );
};

export default Home;
