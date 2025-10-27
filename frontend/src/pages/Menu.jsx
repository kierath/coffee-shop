import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Menu.css';
import darkRoastLogo from '../assets/darkroast-logo.png';
import coldArsenalLogo from '../assets/coldarsenal-logo.png';
import energyWeaponsLogo from '../assets/energyweapons-logo.png';
import IntensityDisplay from '../components/IntensityDisplay';
import basketIcon from '../assets/basket-icon.png';
import arrowIcon from '../assets/arrow-icon.png';

const categoryLogos = { dark: darkRoastLogo, cold: coldArsenalLogo, energy: energyWeaponsLogo };
const categoryMap = { 'Dark Roast': 'dark', 'Cold Arsenal': 'cold', 'Energy Weapon': 'energy' };
const logoClasses = { dark: 'dark-roast-menu-logo-box', cold: 'cold-arsenal-menu-logo-box', energy: 'energy-weapons-menu-logo-box' };

const Menu = () => {
  const navigate = useNavigate();

  // Initialize basket from sessionStorage
  const [basket, setBasket] = useState(() => {
    const saved = sessionStorage.getItem('basket');
    return saved ? JSON.parse(saved) : {};
  });

  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/products');
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []);

  // Keep sessionStorage in sync
  const saveBasket = (updatedBasket) => {
    setBasket(updatedBasket);
    sessionStorage.setItem('basket', JSON.stringify(updatedBasket));
  };

  const addItem = async (id) => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (user) {
      try {
        await axios.post(`http://localhost:5000/cart/${user.id}`, {
          productId: id,
          quantity: 1
        });
      } catch (err) {
        console.error('Failed to add item to cart', err);
      }
    }

    const updated = { ...basket, [id]: (basket[id] || 0) + 1 };
    saveBasket(updated);
  };

  const removeItem = async (id) => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (user && basket[id] === 1) {
      try {
        await axios.delete(`http://localhost:5000/cart/${user.id}/${id}`);
      } catch (err) {
        console.error('Failed to remove item from cart', err);
      }
    } else if (user) {
      try {
        await axios.put(`http://localhost:5000/cart/${user.id}/${id}`, {
          quantity: basket[id] - 1
        });
      } catch (err) {
        console.error('Failed to update item quantity', err);
      }
    }

    const updated = { ...basket };
    if (updated[id] > 1) updated[id] -= 1;
    else delete updated[id];
    saveBasket(updated);
  };

  const renderControls = (id, category) =>
    basket[id] ? (
      <div className={`item-controls ${category}`}>
        <button onClick={() => removeItem(id)}>-</button>
        <span>{basket[id]}</span>
        <button onClick={() => addItem(id)}>+</button>
      </div>
    ) : (
      <button className={`add-btn ${category}`} onClick={() => addItem(id)}>ADD ITEM</button>
    );

  const renderCategorySection = (key, displayName) => {
    const categoryProducts = products.filter(p => categoryMap[p.category] === key);
    if (!categoryProducts.length) return null;

    const sectionClass = key === 'dark' ? 'menu-section-dark-roasts' : key === 'cold' ? 'menu-section-cold-arsenal' : 'menu-section-energy-weapons';
    const textClass = key === 'dark' ? 'menu-section-dark-roasts-text' : key === 'cold' ? 'menu-section-cold-roasts-text' : 'menu-section-energy-weapons-text';

    return (
      <section className={sectionClass}>
        <div className="menu-section-header">
          <div className={logoClasses[key]}>
            <img src={categoryLogos[key]} alt={`${displayName} Logo`} />
          </div>
          <div className={textClass}>
            <h2>{displayName.toUpperCase()}</h2>
            <h4>{categoryProducts.length} BREWS AVAILABLE</h4>
          </div>
        </div>
        <div className="menu-items">
          {categoryProducts.map(p => (
            <div className="menu-item" key={p.id}>
              <div className="menu-item-header">
                <h3>{p.name.toUpperCase()}</h3>
                <p className="price">£{Number(p.price).toFixed(2)}</p>
              </div>
              <IntensityDisplay level={p.intensity} max={5} category={key} />
              <p className="desc">{p.description}</p>
              {renderControls(p.id, key)}
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
        <button className="basket-btn" onClick={() => navigate('/order')}>
          <div className="basket-content">
            <img src={basketIcon} alt="Basket" className="basket-icon" />
            <span className="basket-text">Basket</span>
            {Object.values(basket).reduce((a, b) => a + b, 0) > 0 && (
              <span className="basket-count">{Object.values(basket).reduce((a, b) => a + b, 0)}</span>
            )}
          </div>
        </button>
      </div>

      <div className="line-container-menu">
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
