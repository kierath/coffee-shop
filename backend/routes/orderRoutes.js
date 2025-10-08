const express = require('express');
const router = express.Router();
const pool = require('../config/db');

//GET ALL ORDERS FOR A USER
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(orders.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//GET A SINGLE ORDER BY ID
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (order.rows.length === 0) return res.status(404).json({ message: 'Order not found' });

    const items = await pool.query(
      `SELECT oi.product_id, p.name, oi.quantity, oi.price
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    res.json({ order: order.rows[0], items: items.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//CREATE A NEW ORDER FROM CART
router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get cart items
    const cart = await pool.query(
      `SELECT ci.product_id, ci.quantity, p.price
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1`,
      [userId]
    );

    if (cart.rows.length === 0) return res.status(400).json({ message: 'Cart is empty' });

    // Calculate total
    const total = cart.rows.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Insert order
    const order = await pool.query(
      'INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING *',
      [userId, total]
    );

    // Insert order items
    for (const item of cart.rows) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [order.rows[0].id, item.product_id, item.quantity, item.price]
      );
    }

    // Clear cart
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    res.status(201).json({ message: 'Order placed', orderId: order.rows[0].id });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
