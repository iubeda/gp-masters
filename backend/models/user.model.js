const db = require('../config/database');

const create = async (email, username, passwordHash) => {
  const queryText = `
    INSERT INTO users (email, username, password_hash, created_at)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    RETURNING email, username, role, created_at
  `;
  const result = await db.query(queryText, [email.toLowerCase(), username, passwordHash]);
  return result.rows[0];
};

const findByEmail = async (email) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  return result.rows[0] || null;
};

const findByUsername = async (username) => {
  const result = await db.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
  return result.rows[0] || null;
};

const updateLastLogin = async (email) => {
  await db.query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE email = $1',
    [email.toLowerCase()]
  );
};

const updatePassword = async (email, passwordHash) => {
  await db.query(
    'UPDATE users SET password_hash = $1, token_version = token_version + 1 WHERE email = $2',
    [passwordHash, email.toLowerCase()]
  );
};

const incrementTokenVersion = async (email) => {
  await db.query(
    'UPDATE users SET token_version = token_version + 1 WHERE email = $1',
    [email.toLowerCase()]
  );
};

module.exports = {
  create,
  findByEmail,
  findByUsername,
  updateLastLogin,
  updatePassword,
  incrementTokenVersion
};
