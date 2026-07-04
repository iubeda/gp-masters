const express = require('express');
const teamController = require('../controllers/team.controller');
const authMiddleware = require('../middleware/auth');
const { validateTeam } = require('../middleware/validation');

const router = express.Router();

router.use(authMiddleware);

router.post('/', validateTeam, teamController.registerTeam);

module.exports = router;
