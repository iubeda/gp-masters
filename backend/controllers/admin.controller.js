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
    return res.status(400).json({ error: 'Role is required.', error_code: 'ROLE_IS_REQUIRED' });
  }

  const validRoles = ['admin', 'master', 'manager', 'player'];
  if (!validRoles.includes(role.toLowerCase())) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}`, error_code: 'INVALID_ROLE' });
  }

  const userEmail = email.toLowerCase();
  const currentUserEmail = req.user.email.toLowerCase();

  // Prevent admin from changing their own role (safety check)
  if (userEmail === currentUserEmail) {
    return res.status(400).json({ error: 'No puedes cambiar tu propio rol.', error_code: 'NO_PUEDES_CAMBIAR_TU_PROPIO_RO' });
  }

  const userCheck = await db.query('SELECT email FROM users WHERE email = $1', [userEmail]);
  if (userCheck.rows.length === 0) {
    return res.status(404).json({ error: 'User not found.', error_code: 'USER_NOT_FOUND' });
  }

  await db.query('UPDATE users SET role = $1 WHERE email = $2', [role.toLowerCase(), userEmail]);

  res.json({ message: `Role updated to ${role} successfully for user ${userEmail}.` });
});

const validDictionaries = ['motorcycles', 'pilots', 'circuits'];

const getDictionary = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const tableMap = {
    motorcycles: 'dictionary_motorcycles',
    pilots: 'dictionary_pilots',
    circuits: 'dictionary_circuits'
  };
  const tableName = tableMap[type];

  if (!tableName) {
    return res.status(400).json({ error: 'Invalid dictionary type', error_code: 'INVALID_DICTIONARY_TYPE' });
  }

  const result = await db.query(`SELECT * FROM ${tableName} ORDER BY id ASC`);
  res.json(result.rows);
});

const addDictionaryRecord = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const data = req.body;
  const tableMap = {
    motorcycles: 'dictionary_motorcycles',
    pilots: 'dictionary_pilots',
    circuits: 'dictionary_circuits'
  };
  const tableName = tableMap[type];

  if (!tableName) {
    return res.status(400).json({ error: 'Invalid dictionary type', error_code: 'INVALID_DICTIONARY_TYPE' });
  }

  let queryText = '';
  let queryValues = [];

  if (type === 'motorcycles') {
    const { model_name, engine, gearbox, suspension, chassis, wings } = data;
    if (!model_name || engine === undefined || gearbox === undefined || suspension === undefined || chassis === undefined || wings === undefined) {
      return res.status(400).json({ error: 'All motorcycle fields are required', error_code: 'ALL_MOTORCYCLE_FIELDS_ARE_REQU' });
    }
    if (model_name.length > 100) {
      return res.status(400).json({ error: 'model_name must be 100 characters or less', error_code: 'MODEL_NAME_MUST_BE_100_CHARACT' });
    }
    const attributes = [engine, gearbox, suspension, chassis, wings];
    if (attributes.some(attr => attr < 0 || attr > 100)) {
      return res.status(400).json({ error: 'Attributes must be between 0 and 100', error_code: 'ATTRIBUTES_MUST_BE_BETWEEN_0_A' });
    }
    queryText = `INSERT INTO ${tableName} (model_name, engine, gearbox, suspension, chassis, wings) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    queryValues = [model_name, engine, gearbox, suspension, chassis, wings];
  } else if (type === 'pilots') {
    const { name, talent, consistency, aggressiveness, experience, fitness } = data;
    if (!name || talent === undefined || consistency === undefined || aggressiveness === undefined || experience === undefined || fitness === undefined) {
      return res.status(400).json({ error: 'All pilot fields are required', error_code: 'ALL_PILOT_FIELDS_ARE_REQUIRED' });
    }
    if (name.length > 100) {
      return res.status(400).json({ error: 'name must be 100 characters or less', error_code: 'NAME_MUST_BE_100_CHARACTERS_OR' });
    }
    const attributes = [talent, consistency, aggressiveness, experience, fitness];
    if (attributes.some(attr => attr < 0 || attr > 100)) {
      return res.status(400).json({ error: 'Attributes must be between 0 and 100', error_code: 'ATTRIBUTES_MUST_BE_BETWEEN_0_A' });
    }
    queryText = `INSERT INTO ${tableName} (name, talent, consistency, aggressiveness, experience, fitness) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    queryValues = [name, talent, consistency, aggressiveness, experience, fitness];
  } else if (type === 'circuits') {
    const { name, distance, curves_right, curves_left, curves_rects_ratio, asphalt_wear } = data;
    if (!name || distance === undefined || curves_right === undefined || curves_left === undefined || curves_rects_ratio === undefined || asphalt_wear === undefined) {
      return res.status(400).json({ error: 'All circuit fields are required', error_code: 'ALL_CIRCUIT_FIELDS_ARE_REQUIRE' });
    }
    if (name.length > 100) {
      return res.status(400).json({ error: 'name must be 100 characters or less', error_code: 'NAME_MUST_BE_100_CHARACTERS_OR' });
    }
    if (distance <= 0) {
      return res.status(400).json({ error: 'Distance must be greater than 0', error_code: 'DISTANCE_MUST_BE_GREATER_THAN_' });
    }
    if (curves_right < 0 || curves_left < 0 || curves_rects_ratio < 0 || asphalt_wear < 0 || asphalt_wear > 100) {
      return res.status(400).json({ error: 'Invalid circuit attributes', error_code: 'INVALID_CIRCUIT_ATTRIBUTES' });
    }
    queryText = `INSERT INTO ${tableName} (name, distance, curves_right, curves_left, curves_rects_ratio, asphalt_wear) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    queryValues = [name, distance, curves_right, curves_left, curves_rects_ratio, asphalt_wear];
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
