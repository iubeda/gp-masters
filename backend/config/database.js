const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle pg client', err);
});

const initializeDatabase = async () => {
  if (process.env.NODE_ENV === 'production') {
    logger.info('Skipping schema initialization in production environment.');
    return;
  }
  try {
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute DDL
    await pool.query(schemaSql);
    logger.info('Database initialized successfully with schema and base seeds.');

    if (process.env.SEED_TEST_DATA === 'true') {
      const seedPath = path.join(__dirname, '..', 'seed_championship.sql');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await pool.query(seedSql);
      logger.info('Test championship data seeded successfully.');
    }
  } catch (error) {
    logger.error(`Error initializing database: ${error.message}`, { stack: error.stack });
    process.exit(1);
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  initializeDatabase,
};
