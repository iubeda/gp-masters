const app = require('./app');
const database = require('./config/database');
require('dotenv').config();

if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'test') {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not defined.');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

// Initialize Database DDL and Seeds
database.initializeDatabase().then(() => {
  // Start Server
  app.listen(PORT, () => {
    console.log(`MotoGP Manager backend running on port ${PORT}`);
    
    // Start the background automatic simulation scheduler
    const { startScheduler } = require('./utils/scheduler');
    startScheduler();
  });
});
