const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Endpoints for managing user orders
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         order_id:
 *           type: integer
 *         user_id:
 *           type: integer
 *         total:
 *           type: number
 *           format: float
 *         created_at:
 *           type: string
 *           format: date-time
 *     OrderItem:
 *       type: object
 *       properties:
 *         product_id:
 *           type: integer
 *         name:
 *           type: string
 *         quantity:
 *           type: integer
 *         price:
 *           type: number
 *           format: float
 *     NewOrderResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         order:
 *           $ref: '#/components/schemas/Order'
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 */

/**
 * @swagger
 * /orders/{userId}:
 *   get:
 *     summary: Get all orders for a user
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: A list of user orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       500:
 *         description: Server error
 */
// GET ALL ORDERS FOR A USER
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get all orders for the user
    const ordersResult = await pool.query(
      `SELECT id AS order_id, user_id, total, created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const orders = ordersResult.rows;

    // For each order, fetch its items
    const ordersWithItems = [];
    for (const order of orders) {
      const itemsResult = await pool.query(
        `SELECT order_items.product_id, products.name, order_items.quantity, order_items.price
         FROM order_items
         JOIN products ON order_items.product_id = products.id
         WHERE order_items.order_id = $1`,
        [order.order_id]
      );

      ordersWithItems.push({
        ...order,
        items: itemsResult.rows
      });
    }

    res.json(ordersWithItems);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @swagger
 * /orders/order/{orderId}:
 *   get:
 *     summary: Get a specific order by order ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the order
 *     responses:
 *       200:
 *         description: Order details with items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrderItem'
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
// GET SINGLE ORDER BY ORDER ID
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // GET ORDER DETAILS
    const orderResult = await pool.query(
      `SELECT id AS order_id, user_id, total, created_at
       FROM orders
       WHERE id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) return res.status(404).json({ message: 'Order not found' });

    // GET ORDER ITEMS
    const orderItemsResult = await pool.query(
      `SELECT order_items.product_id, products.name, order_items.quantity, order_items.price
       FROM order_items
       JOIN products ON order_items.product_id = products.id
       WHERE order_items.order_id = $1`,
      [orderId]
    );

    res.json({ order: orderResult.rows[0], items: orderItemsResult.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @swagger
 * /orders/checkout/{userId}:
 *   post:
 *     summary: Checkout cart and create a new order for a user
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user
 *     responses:
 *       201:
 *         description: Order placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NewOrderResponse'
 *       400:
 *         description: Cart is empty
 *       500:
 *         description: Server error
 */
// CREATE NEW ORDER (CHECKOUT)
router.post('/checkout/:userId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId } = req.params;

    // START TRANSACTION
    await client.query('BEGIN');

    // GET CART ITEMS FOR USER
    const cartItemsResult = await client.query(
      `SELECT cart_items.product_id, cart_items.quantity, products.price
       FROM cart_items
       JOIN products ON cart_items.product_id = products.id
       WHERE cart_items.user_id = $1`,
      [userId]
    );
    const cartItems = cartItemsResult.rows;

    if (cartItems.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // CALCULATE TOTAL
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // INSERT NEW ORDER
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total)
       VALUES ($1, $2)
       RETURNING id AS order_id, user_id, total, created_at`,
      [userId, total]
    );
    const order = orderResult.rows[0];

    // INSERT ORDER ITEMS
    for (const item of cartItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [order.order_id, item.product_id, item.quantity, item.price]
      );
    }

    // CLEAR CART
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    // COMMIT TRANSACTION
    await client.query('COMMIT');

    res.status(201).json({ message: 'Order placed successfully', order, items: cartItems });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
});

router.post('/create-payment-intent/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const cartItemsResult = await pool.query(
      `SELECT cart_items.product_id, cart_items.quantity, products.price
       FROM cart_items
       JOIN products ON cart_items.product_id = products.id
       WHERE cart_items.user_id = $1`,
      [userId]
    );

    const cartItems = cartItemsResult.rows;
    if (!cartItems.length) return res.status(400).json({ message: 'Cart is empty' });

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const amount = Math.round(total * 100); // pence

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'gbp',
      metadata: { userId, cart: JSON.stringify(cartItems) },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Stripe payment intent creation failed' });
  }
});
module.exports = router;
