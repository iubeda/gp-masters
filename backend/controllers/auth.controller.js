const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const asyncHandler = require('../utils/asyncHandler');

const JWT_SECRET = process.env.JWT_SECRET;

const register = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  // Check if email already exists
  const existingUserByEmail = await userModel.findByEmail(email);
  if (existingUserByEmail) {
    return res.status(400).json({ error: 'Registration failed. Username or email may already be in use.', error_code: 'REGISTRATION_FAILED_USERNAME_O' });
  }

  // Check if username already exists
  const existingUserByUsername = await userModel.findByUsername(username);
  if (existingUserByUsername) {
    return res.status(400).json({ error: 'Registration failed. Username or email may already be in use.', error_code: 'REGISTRATION_FAILED_USERNAME_O' });
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
    return res.status(400).json({ error: 'Invalid email or password.', error_code: 'INVALID_EMAIL_OR_PASSWORD' });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(400).json({ error: 'Invalid email or password.', error_code: 'INVALID_EMAIL_OR_PASSWORD' });
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

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  res.json({
    message: 'Login successful.',
    user: {
      email: user.email,
      username: user.username,
      role: user.role
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
  });
  res.json({ message: 'Logged out successfully.' });
});

const getSocketToken = asyncHandler(async (req, res) => {
  // Generate temporary token for WebSocket authentication (cross-domain compatible)
  const socketToken = jwt.sign(
    { 
      email: req.user.email, 
      username: req.user.username, 
      role: req.user.role,
      purpose: 'socket'
    },
    JWT_SECRET,
    { expiresIn: '5m' }  // Short-lived token for initial connection
  );

  res.json({ socketToken });
});

module.exports = {
  register,
  login,
  logout,
  getSocketToken
};
