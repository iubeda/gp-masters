const express = require('express');
const simulationController = require('../controllers/simulation.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Todos los endpoints de simulación requieren autenticación
router.use(authMiddleware);

router.get('/status/:championshipId/:circuitId', simulationController.getGPStatus);
router.post('/practice-stint', simulationController.runPracticeStint);
router.post('/qualifying-stint', simulationController.runQualifyingStint);
router.post('/save-strategy', simulationController.saveRaceStrategy);
router.post('/race', simulationController.runRaceSimulation);

module.exports = router;
