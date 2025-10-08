const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET ALL PRODUCTS
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET PRODUCT BT ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ADD A NEW PRODUCT
router.post('/', async (req, res) => {
  try {
    const { name, price, description, intensity, category } = req.body;
    const result = await pool.query(
      'INSERT INTO products (name, price, description, intensity, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, price, description, intensity, category]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// UPDATE A PRODUCT BY ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, intensity, category } = req.body;

    // Update the product
    const result = await pool.query(
      `UPDATE products 
       SET name = $1, price = $2, description = $3, intensity = $4, category = $5 
       WHERE id = $6 
       RETURNING *`,
      [name, price, description, intensity, category, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE A PRODUCT BY ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully', product: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
