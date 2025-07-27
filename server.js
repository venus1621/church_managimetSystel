require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth.routes');
const believerRoutes = require('./routes/believer.routes');
const atbiyaRoutes = require('./routes/atbiya.routes');
const baptismRoutes = require('./routes/baptism.routes');
const deathRoutes = require('./routes/death.routes');
const marriageRoutes = require('./routes/marriage.routes');
const weredaRoutes = require('./routes/weredaBetekihinet.routes');

// Initialize express
const app = express();

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/believers', believerRoutes);
app.use('/api/atbiyas', atbiyaRoutes);
app.use('/api/weredaBetekihinet', weredaRoutes);
app.use('/api/baptisms', baptismRoutes);
app.use('/api/deaths', deathRoutes);
app.use('/api/marriages', marriageRoutes);

// Global Error Handler
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ 
//     success: false, 
//     message: 'Something went wrong!',
//     error: process.env.NODE_ENV === 'production' ? {} : err.message 
//   });
// });

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
