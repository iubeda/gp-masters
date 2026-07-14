const bcrypt = require('bcryptjs');
const userModel = require('../models/user.model');
const asyncHandler = require('../utils/asyncHandler');

const getProfile = asyncHandler(async (req, res) => {
  const user = await userModel.findByEmail(req.user.email);
  if (!user) {
    return res.status(404).json({ error: 'User profile not found.', error_code: 'USER_PROFILE_NOT_FOUND' });
  }

  res.json({
    username: user.username,
    email: user.email,
    last_login: user.last_login
  });
});

const updatePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;
  const userEmail = req.user.email;

  // Fetch user to verify current password
  const user = await userModel.findByEmail(userEmail);
  if (!user) {
    return res.status(404).json({ error: 'User not found.', error_code: 'USER_NOT_FOUND' });
  }

  // Verify current password
  const isMatch = await bcrypt.compare(current_password, user.password_hash);
  if (!isMatch) {
    return res.status(400).json({ error: 'Current password is incorrect.', error_code: 'CURRENT_PASSWORD_IS_INCORRECT' });
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(new_password, salt);

  await userModel.updatePassword(userEmail, passwordHash);

  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.json({ message: 'Password updated successfully. Session will be closed.' });
});

module.exports = {
  getProfile,
  updatePassword
};
