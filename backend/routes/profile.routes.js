const express = require('express');
const profileController = require('../controllers/profile.controller');
const authMiddleware = require('../middleware/auth');
const { validatePasswordUpdate } = require('../middleware/validation');

const router = express.Router();

router.use(authMiddleware);

router.get('/profile', profileController.getProfile);
router.put('/profile/password', validatePasswordUpdate, profileController.updatePassword);

module.exports = router;
