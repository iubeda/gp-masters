const app = require('./app');
const database = require('./config/database');
require('dotenv').config();

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
