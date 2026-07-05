const db = require('../config/database');
const { generateWeather } = require('../services/simulation.engine');

// 1. Obtener o crear el clima de una sesión del fin de semana (independiente por sesión)
// El clima se genera mediante generateWeather() del engine y se persiste aquí.
const getOrCreateWeekend = async (championshipId, circuitId, sessionType) => {
  const selectQuery = `
    SELECT * FROM race_weekends 
    WHERE championship_id = $1 AND circuit_id = $2 AND session_type = $3
  `;
  const existing = await db.query(selectQuery, [championshipId, circuitId, sessionType]);
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  // Generar climatología mediante el motor puro (sin lógica de dominio en el model)
  const weather = generateWeather();

  const insertQuery = `
    INSERT INTO race_weekends (championship_id, circuit_id, session_type, weather_condition, rain_percentage, temp_ambient, temp_asphalt)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const result = await db.query(insertQuery, [
    championshipId,
    circuitId,
    sessionType,
    weather.weather_condition,
    weather.rain_percentage,
    weather.temp_ambient,
    weather.temp_asphalt
  ]);

  return result.rows[0];
};

// 2. Obtener o crear el estado de un equipo para un GP
const getOrCreateTeamStatus = async (championshipId, circuitId, teamId) => {
  const selectQuery = `
    SELECT * FROM gp_team_status 
    WHERE championship_id = $1 AND circuit_id = $2 AND team_id = $3
  `;
  const existing = await db.query(selectQuery, [championshipId, circuitId, teamId]);
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const insertQuery = `
    INSERT INTO gp_team_status (championship_id, circuit_id, team_id)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const result = await db.query(insertQuery, [championshipId, circuitId, teamId]);
  return result.rows[0];
};

// 3. Registrar gomas y setup usados en Entrenamientos y actualizar vueltas
const updatePracticeStatus = async (championshipId, circuitId, teamId, lapsAdded, bestTime) => {
  // Primero obtenemos el estado actual
  const currentStatus = await getOrCreateTeamStatus(championshipId, circuitId, teamId);
  const newLapsUsed = currentStatus.practice_laps_used + lapsAdded;
  
  let newBestTime = currentStatus.best_practice_time;
  if (bestTime !== null) {
    if (newBestTime === null || parseFloat(bestTime) < parseFloat(newBestTime)) {
      newBestTime = bestTime;
    }
  }

  const updateQuery = `
    UPDATE gp_team_status
    SET practice_laps_used = $1, best_practice_time = $2
    WHERE championship_id = $3 AND circuit_id = $4 AND team_id = $5
    RETURNING *
  `;
  const result = await db.query(updateQuery, [newLapsUsed, newBestTime, championshipId, circuitId, teamId]);
  return result.rows[0];
};

// 4. Registrar gomas y setup usados en Clasificación y actualizar vueltas
const updateQualifyingStatus = async (championshipId, circuitId, teamId, lapsAdded, bestTime) => {
  const currentStatus = await getOrCreateTeamStatus(championshipId, circuitId, teamId);
  const newLapsUsed = currentStatus.qualifying_laps_used + lapsAdded;

  let newBestTime = currentStatus.best_qualifying_time;
  if (bestTime !== null) {
    if (newBestTime === null || parseFloat(bestTime) < parseFloat(newBestTime)) {
      newBestTime = bestTime;
    }
  }

  const updateQuery = `
    UPDATE gp_team_status
    SET qualifying_laps_used = $1, best_qualifying_time = $2
    WHERE championship_id = $3 AND circuit_id = $4 AND team_id = $5
    RETURNING *
  `;
  const result = await db.query(updateQuery, [newLapsUsed, newBestTime, championshipId, circuitId, teamId]);
  return result.rows[0];
};

// 5. Guardar el setup definitivo para la carrera
const saveRaceSetup = async (championshipId, circuitId, teamId, setup) => {
  const updateQuery = `
    UPDATE gp_team_status
    SET race_tire_type = $1,
        race_pilot_focus = $2,
        race_setup_engine = $3,
        race_setup_gearbox = $4,
        race_setup_suspension = $5,
        race_setup_chassis = $6,
        race_setup_wings = $7
    WHERE championship_id = $8 AND circuit_id = $9 AND team_id = $10
    RETURNING *
  `;
  const result = await db.query(updateQuery, [
    setup.tire_type,
    setup.pilot_focus,
    setup.setup_engine,
    setup.setup_gearbox,
    setup.setup_suspension,
    setup.setup_chassis,
    setup.setup_wings,
    championshipId,
    circuitId,
    teamId
  ]);
  return result.rows[0];
};

// 6. Insertar registro en el historial de vueltas (para telemetría)
const insertLapHistory = async (lapData) => {
  const insertQuery = `
    INSERT INTO gp_lap_history (
      championship_id, circuit_id, team_id, session_type, stint_number, lap_number,
      lap_time, tire_wear_pct, has_crashed, feedback_received,
      tire_type, pilot_focus, setup_engine, setup_gearbox, setup_suspension, setup_chassis, setup_wings
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *
  `;
  const result = await db.query(insertQuery, [
    lapData.championship_id,
    lapData.circuit_id,
    lapData.team_id,
    lapData.session_type,
    lapData.stint_number || 1,
    lapData.lap_number,
    lapData.lap_time,
    lapData.tire_wear_pct,
    lapData.has_crashed || false,
    lapData.feedback_received || null,
    lapData.tire_type,
    lapData.pilot_focus,
    lapData.setup_engine,
    lapData.setup_gearbox,
    lapData.setup_suspension,
    lapData.setup_chassis,
    lapData.setup_wings
  ]);
  return result.rows[0];
};

// 7. Obtener historial de vueltas
const getLapHistory = async (championshipId, circuitId, teamId, sessionType) => {
  const queryText = `
    SELECT * FROM gp_lap_history
    WHERE championship_id = $1 AND circuit_id = $2 AND team_id = $3 AND session_type = $4
    ORDER BY stint_number ASC, lap_number ASC
  `;
  const result = await db.query(queryText, [championshipId, circuitId, teamId, sessionType]);
  return result.rows;
};

// 8. Obtener los detalles completos de todos los equipos del GP (piloto y moto asociados)
const getGPTeamsDetails = async (championshipId) => {
  const queryText = `
    SELECT t.id AS team_id, t.name AS team_name, t.user_email, u.username AS owner_name, t.balance,
           p.id AS pilot_id, p.name AS pilot_name, p.talent, p.consistency, 
           p.aggressiveness, p.experience, p.fitness,
           m.model_name AS motorcycle_name,
           m.engine, m.gearbox, m.suspension, m.chassis, m.wings
    FROM teams t
    JOIN pilots p ON t.pilot_id = p.id
    JOIN users u ON t.user_email = u.email
    JOIN motorcycles m ON t.motorcycle_id = m.id
    WHERE t.championship_id = $1
    ORDER BY t.id ASC
  `;
  const result = await db.query(queryText, [championshipId]);
  return result.rows;
};

// 9. Obtener el estado consolidado de todos los equipos en un GP
const getGPStatusForAllTeams = async (championshipId, circuitId) => {
  const queryText = `
    SELECT t.id AS team_id, t.name AS team_name, u.username AS owner_name,
           p.name AS pilot_name, m.model_name AS motorcycle_name,
           s.practice_laps_used, s.best_practice_time,
           s.qualifying_laps_used, s.best_qualifying_time,
           s.race_tire_type, s.race_pilot_focus,
           s.grid_position, s.finishing_position, s.race_time, s.status, s.earnings, s.points_earned
    FROM teams t
    JOIN users u ON t.user_email = u.email
    JOIN pilots p ON t.pilot_id = p.id
    JOIN motorcycles m ON t.motorcycle_id = m.id
    LEFT JOIN gp_team_status s ON s.team_id = t.id AND s.circuit_id = $2
    WHERE t.championship_id = $1
    ORDER BY s.finishing_position ASC NULLS LAST, s.best_qualifying_time ASC NULLS LAST, t.id ASC
  `;
  const result = await db.query(queryText, [championshipId, circuitId]);
  return result.rows;
};

// 10. Guardar los resultados finales de carrera y repartir dinero a la cuenta del equipo
const saveRaceResults = async (championshipId, circuitId, teamId, results) => {
  // Iniciar una transacción
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Guardar resultados en gp_team_status
    const updateStatusQuery = `
      UPDATE gp_team_status
      SET grid_position = $1,
          finishing_position = $2,
          race_time = $3,
          status = $4,
          earnings = $5,
          points_earned = $6
      WHERE championship_id = $7 AND circuit_id = $8 AND team_id = $9
      RETURNING *
    `;
    const statusRes = await client.query(updateStatusQuery, [
      results.grid_position,
      results.finishing_position,
      results.race_time,
      results.status,
      results.earnings,
      results.points_earned,
      championshipId,
      circuitId,
      teamId
    ]);

    // 2. Sumar ingresos a la cuenta de balance de teams
    const updateBalanceQuery = `
      UPDATE teams
      SET balance = balance + $1
      WHERE id = $2
    `;
    await client.query(updateBalanceQuery, [results.earnings, teamId]);

    await client.query('COMMIT');
    return statusRes.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// 10 (bis). Obtener el número del siguiente stint para un equipo en una sesión
const getNextStintNumber = async (teamId, circuitId, sessionType) => {
  const result = await db.query(
    'SELECT COALESCE(MAX(stint_number), 0) + 1 AS next_stint FROM gp_lap_history WHERE team_id = $1 AND circuit_id = $2 AND session_type = $3',
    [teamId, circuitId, sessionType]
  );
  return result.rows[0].next_stint;
};

// 11. Actualizar posiciones de la parrilla de salida tras la clasificación
const updateGridPositions = async (circuitId, sortedTeams) => {
  for (let idx = 0; idx < sortedTeams.length; idx++) {
    await db.query(
      'UPDATE gp_team_status SET grid_position = $1 WHERE team_id = $2 AND circuit_id = $3',
      [idx + 1, sortedTeams[idx].team_id, circuitId]
    );
  }
};

// 12. Marcar el fin de semana como completado para la sesión de carrera
const markWeekendCompleted = async (championshipId, circuitId) => {
  await db.query(
    "UPDATE race_weekends SET status = 'completed' WHERE championship_id = $1 AND circuit_id = $2 AND session_type = 'race'",
    [championshipId, circuitId]
  );
};

module.exports = {
  getOrCreateWeekend,
  getOrCreateTeamStatus,
  updatePracticeStatus,
  updateQualifyingStatus,
  saveRaceSetup,
  insertLapHistory,
  getLapHistory,
  getGPTeamsDetails,
  getGPStatusForAllTeams,
  saveRaceResults,
  getNextStintNumber,
  updateGridPositions,
  markWeekendCompleted,
};
