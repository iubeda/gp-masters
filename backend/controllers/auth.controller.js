const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const asyncHandler = require('../utils/asyncHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretmotogpkey';

const register = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  // Check if email already exists
  const existingUserByEmail = await userModel.findByEmail(email);
  if (existingUserByEmail) {
    return res.status(400).json({ error: 'Email is already registered.' });
  }

  // Check if username already exists
  const existingUserByUsername = await userModel.findByUsername(username);
  if (existingUserByUsername) {
    return res.status(400).json({ error: 'Username is already taken.' });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await userModel.create(email, username, passwordHash);
  res.status(201).json({
    message: 'User registered successfully.',
    user: {
      email: user.email,
      username: user.username,
      role: user.role,
      created_at: user.created_at
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await userModel.findByEmail(email);

  if (!user) {
    return res.status(400).json({ error: 'Invalid email or password.' });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(400).json({ error: 'Invalid email or password.' });
  }

  await userModel.updateLastLogin(email);

  const token = jwt.sign(
    { 
      email: user.email, 
      username: user.username, 
      role: user.role,
      tokenVersion: user.token_version || 0  // Include token version for revocation
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    message: 'Login successful.',
    token,
    user: {
      email: user.email,
      username: user.username,
      role: user.role
    },
  });
});

module.exports = {
  register,
  login
};
