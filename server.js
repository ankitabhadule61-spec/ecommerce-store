const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // <-- Added CORS package import
const connectDB = require('./config/db.js');

// 1. Import our custom routing modules
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

// 2. Load environment variables from your .env file
dotenv.config();

// 3. Connect to your MongoDB Atlas cluster
connectDB();

const app = express();

// 4. Global Middleware
app.use(cors()); // <-- Enabled CORS to prevent cross-origin resource blocks
app.use(express.json()); // Parses incoming JSON data in request bodies
app.use(express.static('public')); // Serves your static HTML/CSS/JS files automatically

// 5. Connect API endpoints to their respective route files
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// 6. Basic Health-Check Route (Useful for initial testing)
app.get('/api/test', (req, res) => {
    res.json({ message: "API is working perfectly and all routes are connected!" });
});

// 7. Start the Express Web Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running successfully on port ${PORT}`));