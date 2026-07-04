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

module.exports = {
  getUsers,
  updateUserRole
};
