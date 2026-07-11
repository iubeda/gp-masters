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
    // Las tablas ahora se crean mediante node-pg-migrate en el arranque (ver package.json)

    // Opcional: mantener el seeding de test (si no se movió a una migración)
    if (process.env.SEED_TEST_DATA === 'true') {
      const seedPath = path.join(__dirname, '..', 'seed_championship.sql');
      if (fs.existsSync(seedPath)) {
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        await pool.query(seedSql);
        console.log('Test championship data seeded successfully.');
      }
    }
  } catch (error) {
    console.error('Error initializing database seeds:', error);
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  initializeDatabase,
};
