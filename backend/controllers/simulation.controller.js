const simulationModel = require('../models/simulation.model');
const asyncHandler = require('../utils/asyncHandler');
const db = require('../config/database');
const { validateSessionTime, runStint, runRaceInternal } = require('../services/simulation.service');

// 1. Obtener estado general del fin de semana para el circuito
const getGPStatus = asyncHandler(async (req, res) => {
  const { championshipId, circuitId } = req.params;
  const userEmail = req.user.email;

  const teamRes = await db.query(
    'SELECT id FROM teams WHERE user_email = $1 AND championship_id = $2',
    [userEmail, championshipId]
  );

  let teamId = null;
  let teamStatus = null;
  let practiceLaps = [];
  let qualifyingLaps = [];
  let raceLaps = [];

  if (teamRes.rows.length > 0) {
    teamId = teamRes.rows[0].id;
    teamStatus = await simulationModel.getOrCreateTeamStatus(championshipId, circuitId, teamId);
    practiceLaps = await simulationModel.getLapHistory(championshipId, circuitId, teamId, 'practice');
    qualifyingLaps = await simulationModel.getLapHistory(championshipId, circuitId, teamId, 'qualifying');
    raceLaps = await simulationModel.getLapHistory(championshipId, circuitId, teamId, 'race');
  } else {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes un equipo registrado en este campeonato.' });
    }
  }

  // Obtener/Crear clima para cada sesión de forma independiente
  const practiceWeather = await simulationModel.getOrCreateWeekend(championshipId, circuitId, 'practice');
  const qualifyingWeather = await simulationModel.getOrCreateWeekend(championshipId, circuitId, 'qualifying');
  const raceWeather = await simulationModel.getOrCreateWeekend(championshipId, circuitId, 'race');
  const gridStatus = await simulationModel.getGPStatusForAllTeams(championshipId, circuitId);

  res.json({
    weather: {
      practice: practiceWeather,
      qualifying: qualifyingWeather,
      race: raceWeather
    },
    teamStatus,
    practiceLaps,
    qualifyingLaps,
    raceLaps,
    gridStatus,
    teamId
  });
});

// 2. Simular Tanda de Entrenamientos Libres (Máx 15 vueltas total)
const runPracticeStint = asyncHandler(async (req, res) => {
  const { championship_id, circuit_id, bypassTime } = req.body;
  
  // Security: Only admins can bypass time restrictions (or in test environment)
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.DATABASE_URL?.includes('motogp_test');
  const canBypass = (req.user.role === 'admin' || isTestEnv) && (bypassTime === true || bypassTime === 'true');

  try {
    await validateSessionTime(championship_id, circuit_id, 'practice', canBypass);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const result = await runStint('practice', req.body, req.user.email);
  res.json(result);
});

// 3. Simular Tanda de Clasificación (Máx 3 vueltas total)
const runQualifyingStint = asyncHandler(async (req, res) => {
  const { championship_id, circuit_id, bypassTime } = req.body;
  
  // Security: Only admins can bypass time restrictions (or in test environment)
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.DATABASE_URL?.includes('motogp_test');
  const canBypass = (req.user.role === 'admin' || isTestEnv) && (bypassTime === true || bypassTime === 'true');

  try {
    await validateSessionTime(championship_id, circuit_id, 'qualifying', canBypass);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const result = await runStint('qualifying', req.body, req.user.email);
  res.json(result);
});

// 4. Guardar Estrategia de Carrera definitiva
const saveRaceStrategy = asyncHandler(async (req, res) => {
  const { championship_id, circuit_id, tire_type, pilot_focus, setup_engine, setup_gearbox, setup_suspension, setup_chassis, setup_wings } = req.body;
  const userEmail = req.user.email;

  const teams = await simulationModel.getGPTeamsDetails(championship_id);
  const team = teams.find(t => t.user_email.toLowerCase() === userEmail.toLowerCase());
  if (!team) {
    return res.status(403).json({ error: 'No tienes un equipo registrado en este campeonato.' });
  }

  const updated = await simulationModel.saveRaceSetup(championship_id, circuit_id, team.team_id, {
    tire_type, pilot_focus, setup_engine, setup_gearbox, setup_suspension, setup_chassis, setup_wings
  });

  res.json({ message: 'Estrategia de carrera guardada con éxito.', status: updated });
});

// 5. Simular Carrera Completa (12 Vueltas) — Endpoint HTTP
const runRaceSimulation = asyncHandler(async (req, res) => {
  const { championshipId, circuitId, bypassTime } = req.body;
  const userRole = req.user.role || 'player';

  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Sólo los administradores de la plataforma pueden simular manualmente las carreras.' });
  }

  try {
    await validateSessionTime(championshipId, circuitId, 'race', bypassTime === true || bypassTime === 'true');
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const results = await runRaceInternal(championshipId, circuitId);
  res.json({ message: 'Carrera simulada con éxito.', results });
});

module.exports = {
  getGPStatus,
  runPracticeStint,
  runQualifyingStint,
  saveRaceStrategy,
  runRaceSimulation,
  // Exportado para compatibilidad con el scheduler (usa runRaceInternal del service directamente)
  runRaceSimulationInternal: runRaceInternal,
};
