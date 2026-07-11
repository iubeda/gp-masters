const express = require('express');
const authController = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../middleware/validation');

const router = express.Router();

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/logout', authController.logout);

// Sync route requires a valid token (either Supabase or local, but usually called after Supabase login)
const authMiddleware = require('../middleware/auth');
router.post('/sync', authMiddleware, authController.sync);

module.exports = router;
