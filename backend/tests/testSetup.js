const { Client } = require('pg');
const database = require('../config/database');

const ensureTestDatabaseExists = async () => {
  const connectionString = process.env.DATABASE_URL || 'postgresql://motogp_user:motogp_password@localhost:5432/motogp_test';
  
  // Connect to the default 'postgres' database to run CREATE DATABASE
  const tempConnString = connectionString
    .replace(/\/motogp_test(\?.*)?$/, '/postgres$1')
    .replace(/\/motogp_db(\?.*)?$/, '/postgres$1');
    
  const client = new Client({ connectionString: tempConnString });
  try {
    await client.connect();
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'motogp_test'");
    if (res.rowCount === 0) {
      await client.query("CREATE DATABASE motogp_test");
    }
  } catch (err) {
    // Ignore errors if database already exists or connection fails (e.g. during CI where it's already created)
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
};

const setupTestDatabase = async () => {
  await ensureTestDatabaseExists();
  
  // Overwrite database.js console logs to avoid cluttering test outputs
  const originalLog = console.log;
  console.log = () => {};
  
  try {
    await database.initializeDatabase();
  } finally {
    console.log = originalLog;
  }
};

const cleanTestDatabase = async () => {
  await database.pool.end();
};

module.exports = {
  setupTestDatabase,
  cleanTestDatabase,
};
