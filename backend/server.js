const express = require('express');
const cors = require('cors');

//IMPORT ROUTES
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

//PRODUCT ROUTES
app.use('/products', productRoutes);

//USER ROUTES
app.use('/users', userRoutes);

//AUTH ROUTES
app.use('/auth', authRoutes);

//CART ROUTES
app.use('/cart', cartRoutes);

//ORDER ROUTES
app.use('/orders', orderRoutes);


app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
