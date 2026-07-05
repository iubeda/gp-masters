// =============================================================================
// simulation.service.js — Servicio de Simulación
// Coordina el motor puro (engine) con la capa de persistencia (models).
// =============================================================================

const db = require('../config/database');
const simulationModel = require('../models/simulation.model');
const championshipModel = require('../models/championship.model');
const engine = require('./simulation.engine');

// ---------------------------------------------------------------------------
// validateSessionTime — Validación de restricciones horarias
// ---------------------------------------------------------------------------
/**
 * Lanza un Error si la sesión no está en el horario permitido.
 * @param {string|number} championshipId
 * @param {string|number} circuitId
 * @param {'practice'|'qualifying'|'race'} sessionType
 * @param {boolean} bypass - Si true, omite la validación (para tests y admins)
 */
const validateSessionTime = async (championshipId, circuitId, sessionType, bypass = false) => {
  if (bypass) return;

  const championship = await championshipModel.findById(championshipId);
  if (!championship) throw new Error('Championship not found.');

  const calendar = await championshipModel.findCalendarCircuits(championshipId, championship.start_date);
  const circuitSession = calendar.find(c => c.id === parseInt(circuitId));
  if (!circuitSession) throw new Error('Circuit not found in the championship calendar.');

  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const localDateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const currentHour = now.getHours();

  const targetDateStr = {
    practice:   circuitSession.practice_date,
    qualifying: circuitSession.qualifying_date,
    race:       circuitSession.race_date,
  }[sessionType];

  if (localDateStr !== targetDateStr) {
    throw new Error(`Esta sesión está programada para la fecha: ${targetDateStr}. Hoy es: ${localDateStr}.`);
  }

  if (sessionType === 'practice' || sessionType === 'qualifying') {
    if (currentHour < 12 || currentHour >= 15) {
      const label = sessionType === 'practice' ? 'Entrenamientos' : 'Clasificación';
      throw new Error(`La sesión de ${label} sólo está abierta de 12:00h a 15:00h.`);
    }
  } else if (sessionType === 'race' && currentHour < 14) {
    throw new Error('La Carrera sólo se puede simular a partir de las 14:00h.');
  }
};

// ---------------------------------------------------------------------------
// _getTeamForUser — Helper interno: obtiene el equipo del usuario en un campeonato
// ---------------------------------------------------------------------------
const _getTeamForUser = async (championshipId, userEmail) => {
  const teams = await simulationModel.getGPTeamsDetails(championshipId);
  return teams.find(t => t.user_email.toLowerCase() === userEmail.toLowerCase()) || null;
};

// ---------------------------------------------------------------------------
// runStint — Unifica la lógica de Practice y Qualifying
// ---------------------------------------------------------------------------
/**
 * Ejecuta un stint de práctica o clasificación.
 * @param {'practice'|'qualifying'} sessionType
 * @param {object} params - Parámetros del stint (del body de la request)
 * @param {string} userEmail
 * @returns {object} Resultado del stint
 */
const runStint = async (sessionType, params, userEmail) => {
  const {
    championship_id, circuit_id, laps,
    tire_type, pilot_focus,
    setup_engine, setup_gearbox, setup_suspension, setup_chassis, setup_wings
  } = params;

  const setup = { setup_engine, setup_gearbox, setup_suspension, setup_chassis, setup_wings };

  const maxLaps = sessionType === 'practice' ? engine.PRACTICE_MAX_LAPS : engine.QUALIFYING_MAX_LAPS;
  const lapsUsedField = sessionType === 'practice' ? 'practice_laps_used' : 'qualifying_laps_used';

  // Obtener equipo del usuario
  const team = await _getTeamForUser(championship_id, userEmail);
  if (!team) throw Object.assign(new Error('No tienes un equipo registrado en este campeonato.'), { status: 403 });

  // Chequeo de límite de vueltas
  const teamStatus = await simulationModel.getOrCreateTeamStatus(championship_id, circuit_id, team.team_id);
  const remainingLaps = maxLaps - teamStatus[lapsUsedField];
  if (remainingLaps <= 0) {
    const label = sessionType === 'practice' ? `${maxLaps} vueltas de entrenamientos libres` : `${maxLaps} vueltas de clasificación`;
    throw Object.assign(new Error(`Ya has agotado tus ${label}.`), { status: 400 });
  }
  const lapsToSimulate = Math.min(laps, remainingLaps);

  // Circuito y clima
  const circuitRes = await db.query('SELECT * FROM circuits WHERE id = $1', [circuit_id]);
  const circuit = circuitRes.rows[0];
  const weekend = await simulationModel.getOrCreateWeekend(championship_id, circuit_id, sessionType);

  const stintNumber = await simulationModel.getNextStintNumber(team.team_id, circuit_id, sessionType);

  const pilot = {
    talent: team.talent, consistency: team.consistency,
    experience: team.experience, fitness: team.fitness, aggressiveness: team.aggressiveness
  };
  const bike = {
    engine: team.engine, gearbox: team.gearbox,
    suspension: team.suspension, chassis: team.chassis, wings: team.wings
  };

  let accumulatedWear = 0.0;
  let bestTime = null;
  const simulatedLaps = [];

  // Simular vuelta a vuelta
  for (let i = 1; i <= lapsToSimulate; i++) {
    const lapNum = teamStatus[lapsUsedField] + i;
    const result = engine.simulateLap(pilot, bike, circuit, weekend, tire_type, pilot_focus, setup, accumulatedWear, lapNum, maxLaps);
    accumulatedWear = result.tire_wear_pct;

    const lapData = {
      championship_id, circuit_id,
      team_id:   team.team_id,
      session_type: sessionType,
      stint_number: stintNumber,
      lap_number: lapNum,
      lap_time:   result.lap_time,
      tire_wear_pct: result.tire_wear_pct,
      has_crashed: result.has_crashed,
      feedback_received: result.has_crashed ? (sessionType === 'practice' ? 'Caída en pista.' : 'Caída en clasificación.') : null,
      tire_type, pilot_focus,
      ...setup
    };

    simulatedLaps.push({
      lap_number: lapNum,
      lap_time:   result.lap_time,
      tire_wear_pct: result.tire_wear_pct,
      has_crashed: result.has_crashed
    });

    await simulationModel.insertLapHistory(lapData);

    if (result.has_crashed) break;

    if (bestTime === null || result.lap_time < bestTime) {
      bestTime = result.lap_time;
    }
  }

  // Generar y persistir feedback
  const optimalTime = engine.getOptimalTime(pilot, bike, circuit);
  const feedback = engine.generateFeedback(bestTime, optimalTime, pilot, circuit, setup);

  await db.query(
    'UPDATE gp_lap_history SET feedback_received = $1 WHERE team_id = $2 AND circuit_id = $3 AND stint_number = $4 AND session_type = $5',
    [feedback, team.team_id, circuit_id, stintNumber, sessionType]
  );

  // Actualizar contadores de vueltas y mejor tiempo
  let updatedStatus;
  if (sessionType === 'practice') {
    updatedStatus = await simulationModel.updatePracticeStatus(championship_id, circuit_id, team.team_id, lapsToSimulate, bestTime);
  } else {
    updatedStatus = await simulationModel.updateQualifyingStatus(championship_id, circuit_id, team.team_id, lapsToSimulate, bestTime);

    // Recalcular parrilla de salida tras qualifying
    const allStatuses = await simulationModel.getGPStatusForAllTeams(championship_id, circuit_id);
    const sortedGrid = [...allStatuses].sort((a, b) => {
      if (a.best_qualifying_time === null) return 1;
      if (b.best_qualifying_time === null) return -1;
      return parseFloat(a.best_qualifying_time) - parseFloat(b.best_qualifying_time);
    });
    await simulationModel.updateGridPositions(circuit_id, sortedGrid);
  }

  return { stint_number: stintNumber, simulatedLaps, bestTime, feedback, updatedStatus };
};

// ---------------------------------------------------------------------------
// runRaceInternal — Simulación completa de la carrera (función interna reutilizable)
// ---------------------------------------------------------------------------
/**
 * Simula la carrera completa para todos los equipos inscritos.
 * Usada por el endpoint HTTP y por el scheduler automático.
 * @param {string|number} championshipId
 * @param {string|number} circuitId
 * @returns {Array} Resumen de resultados por equipo
 */
const runRaceInternal = async (championshipId, circuitId) => {
  // Comprobar si la carrera ya fue simulada
  const checkRes = await db.query(
    'SELECT COUNT(*)::int FROM gp_team_status WHERE championship_id = $1 AND circuit_id = $2 AND finishing_position IS NOT NULL',
    [championshipId, circuitId]
  );
  if (checkRes.rows[0].count > 0) {
    throw Object.assign(new Error('La carrera para este Gran Premio ya ha sido simulada.'), { status: 400 });
  }

  const teams = await simulationModel.getGPTeamsDetails(championshipId);
  if (teams.length === 0) throw Object.assign(new Error('No hay equipos inscritos en este campeonato.'), { status: 400 });

  const circuitRes = await db.query('SELECT * FROM circuits WHERE id = $1', [circuitId]);
  const circuit = circuitRes.rows[0];
  if (!circuit) throw new Error('Circuito no encontrado.');

  const weekend = await simulationModel.getOrCreateWeekend(championshipId, circuitId, 'race');

  // Inicializar estados de los pilotos y ordenar la parrilla
  const pilotStates = [];
  for (const team of teams) {
    const status = await simulationModel.getOrCreateTeamStatus(championshipId, circuitId, team.team_id);
    pilotStates.push({
      team, status,
      tire_wear_pct:   0.0,
      total_race_time: 0.0,
      best_lap:        999.9,
      has_crashed:     false,
      grid_position:   status.grid_position || 10,
      laps_history:    []
    });
  }

  pilotStates.sort((a, b) => a.grid_position - b.grid_position);
  pilotStates.forEach((state, index) => { state.grid_position = index + 1; });

  const totalLaps = engine.RACE_LAPS;

  // Loop vuelta a vuelta
  for (let lap = 1; lap <= totalLaps; lap++) {
    // A) Simular cada piloto
    for (const state of pilotStates) {
      if (state.has_crashed) continue;

      const pilot = {
        talent: state.team.talent, consistency: state.team.consistency,
        experience: state.team.experience, fitness: state.team.fitness,
        aggressiveness: state.team.aggressiveness
      };
      const bike = {
        engine: state.team.engine, gearbox: state.team.gearbox,
        suspension: state.team.suspension, chassis: state.team.chassis, wings: state.team.wings
      };
      const tireType   = state.status.race_tire_type      || 'medium';
      const pilotFocus = state.status.race_pilot_focus     || 'balanced';
      const setup = {
        setup_engine:     state.status.race_setup_engine     || 0,
        setup_gearbox:    state.status.race_setup_gearbox    || 0,
        setup_suspension: state.status.race_setup_suspension || 0,
        setup_chassis:    state.status.race_setup_chassis    || 0,
        setup_wings:      state.status.race_setup_wings      || 0
      };

      const result = engine.simulateLap(pilot, bike, circuit, weekend, tireType, pilotFocus, setup, state.tire_wear_pct, lap, totalLaps);
      state.tire_wear_pct = result.tire_wear_pct;

      if (result.has_crashed) {
        state.has_crashed = true;
        state.laps_history.push({ lap_number: lap, lap_time: null, tire_wear_pct: result.tire_wear_pct, has_crashed: true });
        await simulationModel.insertLapHistory({
          championship_id: championshipId, circuit_id: circuitId,
          team_id: state.team.team_id, session_type: 'race', stint_number: 1, lap_number: lap,
          lap_time: null, tire_wear_pct: result.tire_wear_pct, has_crashed: true,
          feedback_received: 'Caída en carrera. DNF.',
          tire_type: tireType, pilot_focus: pilotFocus, ...setup
        });
      } else {
        state.total_race_time += result.lap_time;
        if (result.lap_time < state.best_lap) state.best_lap = result.lap_time;
        state.laps_history.push({ lap_number: lap, lap_time: result.lap_time, tire_wear_pct: result.tire_wear_pct, has_crashed: false });
        await simulationModel.insertLapHistory({
          championship_id: championshipId, circuit_id: circuitId,
          team_id: state.team.team_id, session_type: 'race', stint_number: 1, lap_number: lap,
          lap_time: result.lap_time, tire_wear_pct: result.tire_wear_pct, has_crashed: false,
          feedback_received: null,
          tire_type: tireType, pilot_focus: pilotFocus, ...setup
        });
      }
    }

    // B) Lógica de adelantamientos
    const runningStates = pilotStates.filter(s => !s.has_crashed)
      .sort((a, b) => a.total_race_time - b.total_race_time);

    for (let idx = 1; idx < runningStates.length; idx++) {
      const riderAhead  = runningStates[idx - 1];
      const riderBehind = runningStates[idx];
      const gap = riderBehind.total_race_time - riderAhead.total_race_time;

      if (gap < 0.4) {
        const pilotA = riderBehind.team;
        const pilotB = riderAhead.team;
        const focusA = riderBehind.status.race_pilot_focus || 'balanced';

        let pOvertake = 0.35
          + (pilotA.talent       - pilotB.talent)       * 0.003
          + (pilotA.aggressiveness - pilotB.consistency) * 0.004
          + (pilotA.experience   - pilotB.experience)   * 0.003
          + ((riderBehind.status.race_setup_engine || 0) - (riderAhead.status.race_setup_engine || 0)) * 0.002;

        if (focusA === 'aggressive') pOvertake += 0.15;

        if (Math.random() < pOvertake) {
          riderBehind.total_race_time -= 0.1;
          riderAhead.total_race_time  += 0.3;
          riderBehind.tire_wear_pct    = Math.min(100, riderBehind.tire_wear_pct + 1.5);
          await db.query(
            'UPDATE gp_lap_history SET feedback_received = $1 WHERE team_id = $2 AND circuit_id = $3 AND lap_number = $4 AND session_type = $5',
            [`Adelantó a ${pilotB.pilot_name} de forma espectacular en esta vuelta.`, pilotA.team_id, circuitId, lap, 'race']
          );
        }
      }
    }
  }

  // Clasificación final
  pilotStates.sort((a, b) => {
    if (a.has_crashed && b.has_crashed) return b.laps_history.length - a.laps_history.length;
    if (a.has_crashed) return 1;
    if (b.has_crashed) return -1;
    return a.total_race_time - b.total_race_time;
  });

  const resultsSummary = [];
  for (let idx = 0; idx < pilotStates.length; idx++) {
    const state        = pilotStates[idx];
    const finishingPos = idx + 1;

    let points   = 0;
    let earnings = 10000; // Mínimo DNF

    if (!state.has_crashed) {
      points   = finishingPos <= engine.POINTS_TABLE.length  ? engine.POINTS_TABLE[finishingPos - 1]  : 0;
      earnings = finishingPos <= engine.EARNINGS_TABLE.length ? engine.EARNINGS_TABLE[finishingPos - 1] : 10000;
    }

    const resultObj = {
      grid_position:     state.grid_position,
      finishing_position: finishingPos,
      race_time:         state.has_crashed ? null : parseFloat(state.total_race_time.toFixed(3)),
      status:            state.has_crashed ? 'DNF_crash' : 'finished',
      earnings,
      points_earned:     points
    };

    await simulationModel.saveRaceResults(championshipId, circuitId, state.team.team_id, resultObj);

    resultsSummary.push({
      team_id:            state.team.team_id,
      team_name:          state.team.team_name,
      pilot_name:         state.team.pilot_name,
      grid_position:      state.grid_position,
      finishing_position: finishingPos,
      race_time:          resultObj.race_time,
      status:             resultObj.status,
      earnings,
      points_earned:      points,
      best_lap:           state.best_lap === 999.9 ? null : parseFloat(state.best_lap.toFixed(3))
    });
  }

  await simulationModel.markWeekendCompleted(championshipId, circuitId);

  return resultsSummary;
};

module.exports = {
  validateSessionTime,
  runStint,
  runRaceInternal,
};
