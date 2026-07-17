const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const apiRouter = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');
const csrfProtection = require('./middleware/csrf');
require('dotenv').config();

const app = express();

// Trust proxy (required when behind Nginx/reverse proxy)
app.set('trust proxy', 1);

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
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Apply strict rate limiting to auth routes
app.use('/api/auth', authLimiter);

// Apply CSRF protection
app.use('/api', csrfProtection);

// Mount central API router mapping
app.use('/api', apiRouter);

// Catch-all route
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
