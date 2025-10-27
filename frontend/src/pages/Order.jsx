import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Order.css';
import arrowIcon from '../assets/arrow-icon.png';
import rubbishIcon from '../assets/rubbish-icon.png';

const categoryMap = { 'Dark Roast': 'dark', 'Cold Arsenal': 'cold', 'Energy Weapon': 'energy' };
const categoryDisplayNames = {
  dark: 'Dark Roasts',
  cold: 'Cold Arsenal',
  energy: 'Energy Weapons',
};

const Order = () => {
  const navigate = useNavigate();
  const [basket, setBasket] = useState({});
  const [products, setProducts] = useState([]);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:5000/products');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []);

  // Fetch basket from backend on mount
  useEffect(() => {
    const fetchBasket = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return;

      try {
        const res = await fetch(`http://localhost:5000/cart/${user.id}`);
        const data = await res.json();
        const initialBasket = {};
        data.items.forEach(item => {
          initialBasket[item.product_id] = item.quantity;
        });
        setBasket(initialBasket);
      } catch (err) {
        console.error('Failed to load basket', err);
      }
    };
    fetchBasket();
  }, []);

  const saveBasket = (updated) => setBasket(updated);

  const addItem = async (id) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      await fetch(`http://localhost:5000/cart/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id, quantity: 1 }),
      });
    }

    const updated = { ...basket, [id]: (basket[id] || 0) + 1 };
    saveBasket(updated);
  };

  const removeItem = async (id) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    if (basket[id] === 1) {
      await fetch(`http://localhost:5000/cart/${user.id}/${id}`, { method: 'DELETE' });
    } else {
      await fetch(`http://localhost:5000/cart/${user.id}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: basket[id] - 1 }),
      });
    }

    const updated = { ...basket };
    if (updated[id] > 1) updated[id] -= 1;
    else delete updated[id];
    saveBasket(updated);
  };

  const cartItems = products
    .filter(p => basket[p.id])
    .map(p => ({ ...p, quantity: basket[p.id] }));

  const total = cartItems.reduce((sum, item) => sum + item.quantity * Number(item.price), 0);
  const totalItems = Object.values(basket).reduce((sum, qty) => sum + qty, 0);

  const groupedItems = cartItems.reduce((acc, item) => {
    const category = categoryMap[item.category];
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  if (!cartItems.length) {
    return (
      <div className="order-container">
        <button className="back-btn" onClick={() => navigate('/menu')}>
          <img src={arrowIcon} alt="Back Arrow" className="arrow-icon" />
          <span className="back-text">Back</span>
        </button>
        <h2>Your basket is empty</h2>
      </div>
    );
  }

  return (
    <div className="order-container">
      <div className="order-header">
        <button className="back-btn" onClick={() => navigate('/menu')}>
          <img src={arrowIcon} alt="Back Arrow" className="arrow-icon" />
          <span className="back-text">Back</span>
        </button>
        <div className="order-header-title">
          <h1>COMBAT BASKET</h1>
        </div>
      </div>

      <div className="line-container-order">
        <div className="gradient-line"></div>
        <h5>{totalItems} ITEMS SELECTED</h5>
      </div>

      {Object.entries(groupedItems).map(([category, items]) => (
        <section
          key={category}
          className={
            category === 'dark'
              ? 'order-section-dark-roasts'
              : category === 'cold'
                ? 'order-section-cold-arsenal'
                : 'order-section-energy-weapons'
          }
        >
          <div className="order-section-header">
            <div>
              <h2>{categoryDisplayNames[category].toUpperCase()}</h2>
              <h4>{items.length} BREWS IN YOUR ORDER</h4>
            </div>
          </div>

          <div className="order-items">
            {items.map(item => (
              <div className="order-item" key={item.id}>
                <div className="order-item-header">
                  <h3>{item.name.toUpperCase()}</h3>
                  <p className="price">£{(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <div className={`item-controls ${category}`}>
                  <button onClick={() => removeItem(item.id)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => addItem(item.id)}>+</button>
                  <button
                    className="remove-item-btn"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => {
                      const updatedBasket = { ...basket };
                      delete updatedBasket[item.id];
                      saveBasket(updatedBasket);
                    }}
                  >
                    <img src={rubbishIcon} alt="" className="rubbish-icon" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="order-total">
        <h2>TOTAL: £{total.toFixed(2)}</h2>
        <button
          className="checkout-btn"
          onClick={async () => {
            try {
              const user = JSON.parse(localStorage.getItem('user'));
              if (!user) {
                alert('Please log in before placing an order.');
                navigate('/login');
                return;
              }

              const res = await fetch(`http://localhost:5000/cart/checkout/${user.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              });

              if (!res.ok) {
                const msg = await res.text();
                alert(`Checkout failed: ${msg}`);
                return;
              }

              const data = await res.json();
              console.log('Order placed successfully:', data);

              // Clear basket
              setBasket({});
              alert(`Order placed successfully! Total: £${data.total.toFixed(2)}`);

              navigate('/profile');
            } catch (err) {
              console.error('Checkout error:', err);
              alert('Something went wrong during checkout.');
            }
          }}
        >
          CHECKOUT
        </button>
      </div>
    </div>
  );
};

export default Order;
