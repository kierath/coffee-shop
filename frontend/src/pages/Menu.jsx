// src/pages/Menu.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Menu.css';
import darkRoastLogo from '../assets/darkroast-logo.png';
import coldArsenalLogo from '../assets/coldarsenal-logo.png';
import energyWeaponsLogo from '../assets/energyweapons-logo.png';
import IntensityDisplay from '../components/IntensityDisplay';
import basketIcon from '../assets/basket-icon.png';
import arrowIcon from '../assets/arrow-icon.png';

// Map frontend keys to logos
const categoryLogos = {
  dark: darkRoastLogo,
  cold: coldArsenalLogo,
  energy: energyWeaponsLogo,
};

// Map backend categories to frontend keys
const categoryMap = {
  'Dark Roast': 'dark',
  'Cold Arsenal': 'cold',
  'Energy Weapon': 'energy',
};

// Map frontend keys to exact CSS logo box classes
const logoClasses = {
  dark: 'dark-roast-menu-logo-box',
  cold: 'cold-arsenal-menu-logo-box',
  energy: 'energy-weapons-menu-logo-box',
};

const Menu = () => {
  const navigate = useNavigate();
  const [basket, setBasket] = useState({});
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/products'); // adjust port if needed
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []);

  const addItem = (itemId) => {
    setBasket({ ...basket, [itemId]: (basket[itemId] || 0) + 1 });
  };

  const removeItem = (itemId) => {
    if (basket[itemId] > 1) {
      setBasket({ ...basket, [itemId]: basket[itemId] - 1 });
    } else {
      const updatedBasket = { ...basket };
      delete updatedBasket[itemId];
      setBasket(updatedBasket);
    }
  };

  const renderControls = (itemId, category) => {
    if (basket[itemId]) {
      return (
        <div className={`item-controls ${category}`}>
          <button onClick={() => removeItem(itemId)}>-</button>
          <span>{basket[itemId]}</span>
          <button onClick={() => addItem(itemId)}>+</button>
        </div>
      );
    } else {
      return (
        <button className={`add-btn ${category}`} onClick={() => addItem(itemId)}>
          ADD ITEM
        </button>
      );
    }
  };

  const renderCategorySection = (categoryKey, displayName) => {
    const categoryProducts = products.filter(
      (p) => categoryMap[p.category] === categoryKey
    );

    if (!categoryProducts.length) return null;

    const sectionClass =
      categoryKey === 'dark'
        ? 'menu-section-dark-roasts'
        : categoryKey === 'cold'
        ? 'menu-section-cold-arsenal'
        : 'menu-section-energy-weapons';

    const textClass =
      categoryKey === 'dark'
        ? 'menu-section-dark-roasts-text'
        : categoryKey === 'cold'
        ? 'menu-section-cold-roasts-text'
        : 'menu-section-energy-weapons-text';

    return (
      <section className={sectionClass}>
        <div className="menu-section-header">
          <div className={logoClasses[categoryKey]}>
            <img src={categoryLogos[categoryKey]} alt={`${displayName} Logo`} />
          </div>
          <div className={textClass}>
            <h2>{displayName.toUpperCase()}</h2>
            <h4>{categoryProducts.length} BREWS AVAILABLE</h4>
          </div>
        </div>
        <div className="menu-items">
          {categoryProducts.map((product) => (
            <div className="menu-item" key={product.id}>
              <div className="menu-item-header">
                <h3>{product.name.toUpperCase()}</h3>
                <p className="price">£{parseFloat(product.price).toFixed(2)}</p>
              </div>
              <IntensityDisplay
                level={product.intensity}
                max={5}
                category={categoryKey}
              />
              <p className="desc">{product.description}</p>
              {renderControls(product.id, categoryKey)}
            </div>
          ))}
        </div>
      </section>
    );
  };

  if (!products.length) return <div>Loading menu...</div>;

  return (
    <div className="menu-container">
      <div className="menu-header">
        <button className="back-btn" onClick={() => navigate('/')}>
         <img src={arrowIcon} alt="Back Arrow" className="arrow-icon" />
         <span className="back-text">Back</span>
        </button>
        <h1>COFFEE MENU</h1>
        <button className="basket-btn">
          <div className="basket-content">
            <img src={basketIcon} alt="Basket" className="basket-icon" />
            <span className="basket-text">Basket</span>
            {Object.values(basket).reduce((a, b) => a + b, 0) > 0 && (
              <span className="basket-count">
                {Object.values(basket).reduce((a, b) => a + b, 0)}
              </span>
            )}
          </div>
        </button>
      </div>

      <div className="line-container">
        <div className="gradient-line"></div>
        <h5>TACTICAL COFFEE ARSENAL</h5>
      </div>

      {renderCategorySection('dark', 'Dark Roasts')}
      {renderCategorySection('cold', 'Cold Arsenal')}
      {renderCategorySection('energy', 'Energy Weapons')}
    </div>
  );
};

export default Menu;
