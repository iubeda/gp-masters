const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle pg client', err);
});

const initializeDatabase = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.log('Skipping schema initialization in production environment.');
    return;
  }
  try {
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute DDL
    await pool.query(schemaSql);
    console.log('Database initialized successfully with schema and base seeds.');

    if (process.env.SEED_TEST_DATA === 'true') {
      const seedPath = path.join(__dirname, '..', 'seed_championship.sql');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await pool.query(seedSql);
      console.log('Test championship data seeded successfully.');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  initializeDatabase,
};
