const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const apiRouter = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();

// Security Headers
app.use(helmet());

// Global Rate Limiter: 100 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Strict Rate Limiter for Authentication endpoints: 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Core HTTP Middlewares
app.use(cors());
app.use(express.json());

// Apply strict rate limiting to auth routes
app.use('/api/auth', authLimiter);

// Mount central API router mapping
app.use('/api', apiRouter);

// Catch-all route
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
