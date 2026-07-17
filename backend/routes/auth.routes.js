const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

const router = express.Router();

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/logout', authController.logout);
router.get('/socket-token', authMiddleware, authController.getSocketToken);

module.exports = router;
