const express = require('express');
const router = express.Router();

// Example: get all users
router.get('/', (req, res) => {
  res.json([{ id: 1, username: 'JohnDoe' }]);
});

module.exports = router;
