const bcrypt = require('bcryptjs');
const userModel = require('../models/user.model');
const asyncHandler = require('../utils/asyncHandler');

const getProfile = asyncHandler(async (req, res) => {
  const user = await userModel.findByEmail(req.user.email);
  if (!user) {
    return res.status(404).json({ error: 'User profile not found.' });
  }

  res.json({
    username: user.username,
    email: user.email,
    last_login: user.last_login
  });
});

const updatePassword = asyncHandler(async (req, res) => {
  const { new_password } = req.body;
  const userEmail = req.user.email;

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(new_password, salt);

  await userModel.updatePassword(userEmail, passwordHash);

  res.json({ message: 'Password updated successfully. Session will be closed.' });
});

module.exports = {
  getProfile,
  updatePassword
};
