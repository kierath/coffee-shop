const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();
require('./config/passport'); // Passport config

// Routes
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const setupSwagger = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['https://coffee-shop-ohi5hcqnu-kieraths-projects.vercel.app/'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 2 //2 hours 
    }
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/products', productRoutes);
app.use('/users', userRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/auth', authRoutes);

// Swagger
setupSwagger(app);

app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
