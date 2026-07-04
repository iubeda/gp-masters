const express = require('express');
const championshipController = require('../controllers/championship.controller');
const teamController = require('../controllers/team.controller');
const authMiddleware = require('../middleware/auth');
const { validateChampionship } = require('../middleware/validation');

const router = express.Router();

router.use(authMiddleware);

router.get('/', championshipController.getChampionships);
router.post('/', validateChampionship, championshipController.createChampionship);
router.get('/:id', championshipController.getChampionshipDetail);
router.get('/:id/teams', teamController.getChampionshipTeams);
router.post('/:id/kick', championshipController.kickUser);

module.exports = router;
