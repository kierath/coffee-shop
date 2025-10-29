import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './Order.css';
import arrowIcon from '../assets/arrow-icon.png';
import rubbishIcon from '../assets/rubbish-icon.png';

const categoryMap = { 
  'Dark Roast': 'dark',
  'Cold Arsenal': 'cold', 
  'Energy Weapon': 'energy' 
};
const categoryDisplayNames = { dark: 'Dark Roasts', cold: 'Cold Arsenal', energy: 'Energy Weapons' };

const stripePromise = loadStripe(`${process.env.STRIPE_SECRET_KEY}`);

// Stripe Checkout form
const StripeCheckoutForm = ({ total, userId, clearBasket, navigate }) => {
  const stripe = useStripe();
  const elements = useElements();

  const handlePayment = async () => {
    if (!stripe || !elements) return;

    try {
      // Create payment intent
      const res = await fetch(`${process.env.REACT_APP_API_URL}/orders/create-payment-intent/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const { clientSecret } = await res.json();

      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (result.error) return alert(`Payment failed: ${result.error.message}`);

      if (result.paymentIntent.status === 'succeeded') {
        const checkoutRes = await fetch(`${process.env.REACT_APP_API_URL}/orders/checkout/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!checkoutRes.ok) {
          const msg = await checkoutRes.text();
          return alert(`Order creation failed: ${msg}`);
        }

        clearBasket();
        alert('Payment successful! Order placed.');
        navigate('/profile');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong during payment.');
    }
  };

  return (
    <div className="stripe-checkout">
      <CardElement />
      <button className="checkout-btn" onClick={handlePayment}>
        Pay £{total.toFixed(2)}
      </button>
    </div>
  );
};

const Order = () => {
  const navigate = useNavigate();
  const [basket, setBasket] = useState({});
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/products`);
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []);

  // Initialize and sync basket
  useEffect(() => {
    const initializeBasket = async () => {
      const saved = JSON.parse(sessionStorage.getItem('basket') || '{}');

      if (user) {
        // Logged-in: fetch backend basket
        try {
          const res = await fetch(`${process.env.REACT_APP_API_URL}/cart/${user.id}`);
          const data = await res.json();
          const backendBasket = {};
          data.items.forEach(item => {
            backendBasket[item.product_id] = item.quantity;
          });

          // Merge guest basket into backend basket
          const mergedBasket = { ...saved, ...backendBasket };
          setBasket(mergedBasket);
          sessionStorage.setItem('basket', JSON.stringify(mergedBasket));
        } catch (err) {
          console.error('Failed to load basket', err);
        }
      } else {
        // Guest: use sessionStorage
        setBasket(saved);
      }
    };

    initializeBasket();
  }, [user]);

  const saveBasket = (updated) => {
    setBasket(updated);
    sessionStorage.setItem('basket', JSON.stringify(updated));
  };

  const addItem = async (id) => {
    const updated = { ...basket, [id]: (basket[id] || 0) + 1 };
    saveBasket(updated);

    if (user) {
      try {
        await fetch(`${process.env.REACT_APP_API_URL}/cart/${user.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: id, quantity: 1 }),
        });
      } catch (err) {
        console.error('Failed to add item to backend cart', err);
      }
    }
  };

  const removeItem = async (id) => {
    const updated = { ...basket };
    if (updated[id] > 1) updated[id] -= 1;
    else delete updated[id];
    saveBasket(updated);

    if (user) {
      try {
        if (updated[id]) {
          await fetch(`${process.env.REACT_APP_API_URL}/cart/${user.id}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: updated[id] }),
          });
        } else {
          await fetch(`${process.env.REACT_APP_API_URL}/cart/${user.id}/${id}`, { method: 'DELETE' });
        }
      } catch (err) {
        console.error('Failed to update backend cart', err);
      }
    }
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

  return (
    <div className="order-container">
      {/* Header */}
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

      {cartItems.length === 0 ? (
        <div className="empty-basket-message">
          <p>Your basket is empty.</p>
        </div>
      ) : (
        Object.entries(groupedItems).map(([category, items]) => (
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
                      <img src={rubbishIcon} alt="Rubbish Icon" className="rubbish-icon" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {cartItems.length > 0 && (
        <div className="mobile-checkout-container">
          <div className="order-total">
            <h2>TOTAL: £{total.toFixed(2)}</h2>
          </div>

          <div className="stripe-checkout">
            {user ? (
              <Elements stripe={stripePromise}>
                <StripeCheckoutForm
                  total={total}
                  userId={user.id}
                  clearBasket={() => {
                    setBasket({});
                    sessionStorage.removeItem('basket');
                  }}
                  navigate={navigate}
                />
              </Elements>
            ) : (
              <button
                className="checkout-btn"
                onClick={() => navigate('/login', { state: { fromOrder: true } })}
              >
                Log in to checkout
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Order;
