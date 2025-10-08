// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all products
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add a new product
router.post('/', async (req, res) => {
  try {
    const { name, price, description, intensity, category } = req.body;
    const result = await pool.query(
      'INSERT INTO products (name, price, description, intensity, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, price, description, intensity, category]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;