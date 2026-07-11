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
    // Run migrations dynamically on test database
    const { runner } = require('node-pg-migrate');
    const path = require('path');
    await runner({
      databaseUrl: process.env.DATABASE_URL || 'postgresql://motogp_user:motogp_password@localhost:5432/motogp_test',
      dir: path.join(__dirname, '..', 'migrations'),
      direction: 'up',
      migrationsTable: 'pgmigrations',
      log: () => {}, // silence migration logs in tests
    });

    await database.initializeDatabase();
  } finally {
    console.log = originalLog;
  }
};

const cleanTestDatabase = async () => {
  // Do NOT call pool.end() here — the pool is a singleton shared across all test files.
  // Closing it in one file's afterAll breaks subsequent test files.
  // The pool will be naturally closed when the test process exits.
  //
  // Instead, truncate all tables to leave a clean state for the next test file.
  try {
    await database.pool.query(`
      TRUNCATE TABLE gp_lap_history, gp_team_status, race_weekends,
        championship_circuits, teams, championships, users
      RESTART IDENTITY CASCADE
    `);
  } catch (e) {
    // If truncation fails (e.g., pool already closed), ignore — setupTestDatabase will reinitialize anyway
  }
};


module.exports = {
  setupTestDatabase,
  cleanTestDatabase,
};
