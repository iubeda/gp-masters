const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    process.env.NODE_ENV === 'production' 
      ? winston.format.json() 
      : winston.format.simple()
  ),
  transports: [
    new winston.transports.Console()
  ],
});

// Avoid logging errors during testing so the test output is clean
if (process.env.NODE_ENV === 'test') {
  logger.silent = true;
}

module.exports = logger;
