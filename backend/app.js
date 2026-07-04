const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();

// Core HTTP Middlewares
app.use(cors());
app.use(express.json());

// Mount central API router mapping
app.use('/api', apiRouter);

// Catch-all route
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
