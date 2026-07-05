const db = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');

const getUsers = asyncHandler(async (req, res) => {
  const result = await db.query(
    'SELECT email, username, role, last_login, created_at FROM users ORDER BY username ASC'
  );
  res.json(result.rows);
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ error: 'Role is required.' });
  }

  const validRoles = ['admin', 'master', 'manager', 'player'];
  if (!validRoles.includes(role.toLowerCase())) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
  }

  const userEmail = email.toLowerCase();
  const currentUserEmail = req.user.email.toLowerCase();

  // Prevent admin from changing their own role (safety check)
  if (userEmail === currentUserEmail) {
    return res.status(400).json({ error: 'No puedes cambiar tu propio rol.' });
  }

  const userCheck = await db.query('SELECT email FROM users WHERE email = $1', [userEmail]);
  if (userCheck.rows.length === 0) {
    return res.status(404).json({ error: 'User not found.' });
  }

  await db.query('UPDATE users SET role = $1 WHERE email = $2', [role.toLowerCase(), userEmail]);

  res.json({ message: `Role updated to ${role} successfully for user ${userEmail}.` });
});

const validDictionaries = ['motorcycles', 'pilots', 'circuits'];

const getDictionary = asyncHandler(async (req, res) => {
  const { type } = req.params;
  if (!validDictionaries.includes(type)) {
    return res.status(400).json({ error: 'Invalid dictionary type' });
  }

  const result = await db.query(`SELECT * FROM dictionary_${type} ORDER BY id ASC`);
  res.json(result.rows);
});

const addDictionaryRecord = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const data = req.body;

  if (!validDictionaries.includes(type)) {
    return res.status(400).json({ error: 'Invalid dictionary type' });
  }

  let queryText = '';
  let queryValues = [];

  if (type === 'motorcycles') {
    const { model_name, engine, gearbox, suspension, chassis, wings } = data;
    if (!model_name || engine === undefined || gearbox === undefined || suspension === undefined || chassis === undefined || wings === undefined) {
      return res.status(400).json({ error: 'All motorcycle fields are required' });
    }
    const attributes = [engine, gearbox, suspension, chassis, wings];
    if (attributes.some(attr => attr < 0 || attr > 100)) {
      return res.status(400).json({ error: 'Attributes must be between 0 and 100' });
    }
    queryText = 'INSERT INTO dictionary_motorcycles (model_name, engine, gearbox, suspension, chassis, wings) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
    queryValues = [model_name, engine, gearbox, suspension, chassis, wings];
  } else if (type === 'pilots') {
    const { name, talent, consistency, aggressiveness, experience, fitness } = data;
    if (!name || talent === undefined || consistency === undefined || aggressiveness === undefined || experience === undefined || fitness === undefined) {
      return res.status(400).json({ error: 'All pilot fields are required' });
    }
    const attributes = [talent, consistency, aggressiveness, experience, fitness];
    if (attributes.some(attr => attr < 0 || attr > 100)) {
      return res.status(400).json({ error: 'Attributes must be between 0 and 100' });
    }
    queryText = 'INSERT INTO dictionary_pilots (name, talent, consistency, aggressiveness, experience, fitness) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
    queryValues = [name, talent, consistency, aggressiveness, experience, fitness];
  } else if (type === 'circuits') {
    const { name, distance } = data;
    if (!name || distance === undefined) {
      return res.status(400).json({ error: 'All circuit fields are required' });
    }
    if (distance <= 0) {
      return res.status(400).json({ error: 'Distance must be greater than 0' });
    }
    queryText = 'INSERT INTO dictionary_circuits (name, distance) VALUES ($1, $2) RETURNING *';
    queryValues = [name, distance];
  }

  const result = await db.query(queryText, queryValues);
  res.status(201).json(result.rows[0]);
});

module.exports = {
  getUsers,
  updateUserRole,
  getDictionary,
  addDictionaryRecord
};
