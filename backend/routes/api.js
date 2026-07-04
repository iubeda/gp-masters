const express = require('express');
const authRouter = require('./auth.routes');
const championshipRouter = require('./championship.routes');
const teamRouter = require('./team.routes');
const profileRouter = require('./profile.routes');
const simulationRouter = require('./simulation.routes');
const adminRouter = require('./admin.routes');

const championshipController = require('../controllers/championship.controller');
const teamController = require('../controllers/team.controller');

const authMiddleware = require('../middleware/auth');
const { validateCalendar } = require('../middleware/validation');

const router = express.Router();

// Modular Sub-routers mapping
router.use('/auth', authRouter);
router.use('/championships', championshipRouter);
router.use('/teams', teamRouter);
router.use('/users', profileRouter);
router.use('/simulation', simulationRouter);
router.use('/admin', adminRouter);

// Flat endpoints mapping
router.post('/calendar', authMiddleware, validateCalendar, championshipController.addCalendarCircuit);
router.get('/pilots', authMiddleware, teamController.getPilots);
router.get('/circuits', authMiddleware, teamController.getCircuits);

module.exports = router;
