import React, { useEffect, useState } from 'react';
import './OrderHistory.css';

const OrderHistory = ({ userId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/orders/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error(err);
        setError('Could not load order history');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  if (loading) return <p>Loading order history...</p>;
  if (error) return <p>{error}</p>;

  if (!orders.length) {
    return (
      <div className="order-history-container">
        <h2>Order History</h2>
        <p>No orders found.</p>
      </div>
    );
  }

  return (
    <div className="order-history-container">
      <h2>Order History</h2>
      {orders.map((order) => (
        <div key={`order-${order.order_id}`} className="order-history-card">
          <div className="order-header">
            <h3>Order #{order.order_id}</h3>
            <p>{new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          <ul className="order-items-list">
            {order.items?.map((item, index) => (
              <li key={`order-${order.order_id}-item-${index}`}>
                <span>{item.name} x {item.quantity}</span>
                <span>£{(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="order-footer">
            Total: £{Number(order.total).toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderHistory;
