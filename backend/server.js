const app = require('./app');
const database = require('./config/database');
require('dotenv').config();

const http = require('http');

const PORT = process.env.PORT || 5000;

// Initialize Database DDL and Seeds
database.initializeDatabase().then(() => {
  // Create HTTP server from Express app
  const server = http.createServer(app);
  
  // Initialize Socket.IO
  const { initSocket } = require('./services/socket.service');
  initSocket(server);

  // Start Server
  server.listen(PORT, () => {
    console.log(`MotoGP Manager backend running on port ${PORT}`);
    
    // Start the background automatic simulation scheduler
    const { startScheduler } = require('./utils/scheduler');
    startScheduler();
  });
});
