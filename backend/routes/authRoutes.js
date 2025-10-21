const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const pool = require('../config/db');

/**
 * REGISTER NEW USER
 */

router.post('/register', async (req, res) => {
  
  try {
    const { name, email, password } = req.body;

    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length > 0) {
      const existingUser = userResult.rows[0];
      if (existingUser.password) {
        return res.status(400).json({ message: 'User already exists' });
      } else {
        // Google-only account also have a password
        const hashedPassword = await bcrypt.hash(password, 10);
        const update = await pool.query(
          'UPDATE users SET password = $1, provider = $2 WHERE email = $3 RETURNING id, name, email',
          [hashedPassword, 'local', email]
        );
        return res.status(200).json(update.rows[0]);
      }
    }

    //NEW LOCAL USER
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, provider) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
      [name, email, hashedPassword, 'local']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

/**
 * LOGIN WITH EMAIL/PASSWORD
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(400).json({ message: 'Invalid credentials' });

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

/**
 * GOOGLE LOGIN
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign({ id: req.user.id, email: req.user.email, name: req.user.name }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
    res.redirect(`http://localhost:3000/?token=${token}`);
  }
);

module.exports = router;
