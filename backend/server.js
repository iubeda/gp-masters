const app = require('./app');
const database = require('./config/database');
const logger = require('./utils/logger');
require('dotenv').config();

if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'test') {
  logger.error('FATAL ERROR: JWT_SECRET environment variable is not defined.');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

// Initialize Database DDL and Seeds
database.initializeDatabase().then(() => {
  // Start Server
  app.listen(PORT, () => {
    logger.info(`MotoGP Manager backend running on port ${PORT}`);
    
    // Start the background automatic simulation scheduler
    const { startScheduler } = require('./utils/scheduler');
    startScheduler();
  });
});
