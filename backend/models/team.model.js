const db = require('../config/database');

const countTeams = async (championshipId) => {
  const result = await db.query('SELECT COUNT(*)::int FROM teams WHERE championship_id = $1', [championshipId]);
  return result.rows[0].count;
};

const checkUserRegistration = async (userEmail, championshipId) => {
  const result = await db.query(
    'SELECT id FROM teams WHERE user_email = $1 AND championship_id = $2',
    [userEmail, championshipId]
  );
  return result.rows.length > 0;
};

const findRegisteredPilots = async (championshipId) => {
  const result = await db.query(
    'SELECT pilot_id FROM teams WHERE championship_id = $1',
    [championshipId]
  );
  return result.rows.map(r => r.pilot_id);
};

const findRegisteredTeams = async (championshipId) => {
  const queryText = `
    SELECT t.id, t.name AS team_name, t.user_email, u.username AS owner_name, t.balance,
           t.is_kicked, t.kick_reason,
           p.id AS pilot_id, p.name AS pilot_name, p.talent, p.consistency, 
           p.aggressiveness, p.experience, p.fitness,
           m.model_name AS motorcycle_name,
           m.engine, m.gearbox, m.suspension, m.chassis, m.wings,
           (SELECT COALESCE(SUM(s.points_earned), 0)::int 
            FROM gp_team_status s 
            WHERE s.team_id = t.id AND s.championship_id = $1) AS total_points,
           (SELECT COUNT(*)::int
            FROM gp_team_status s
            JOIN race_weekends rw ON s.championship_id = rw.championship_id AND s.circuit_id = rw.circuit_id
            WHERE s.team_id = t.id AND rw.session_type = 'race' AND rw.status = 'completed') AS races_completed
    FROM teams t
    JOIN dictionary_pilots p ON t.pilot_id = p.id
    JOIN users u ON t.user_email = u.email
    JOIN dictionary_motorcycles m ON t.motorcycle_id = m.id
    WHERE t.championship_id = $1
    ORDER BY total_points DESC, t.id ASC
  `;
  const result = await db.query(queryText, [championshipId]);
  return result.rows;
};

const createTeam = async (name, userEmail, championshipId, pilotId, motorcycleId) => {
  const queryText = `
    INSERT INTO teams (name, user_email, championship_id, pilot_id, motorcycle_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const result = await db.query(queryText, [name, userEmail, championshipId, pilotId, motorcycleId]);
  return result.rows[0];
};

const findAllPilots = async () => {
  const result = await db.query('SELECT id, name FROM dictionary_pilots');
  return result.rows;
};

const findAllMotorcycles = async () => {
  const result = await db.query('SELECT id, model_name FROM dictionary_motorcycles');
  return result.rows;
};

module.exports = {
  countTeams,
  checkUserRegistration,
  findRegisteredPilots,
  findRegisteredTeams,
  createTeam,
  findAllPilots,
  findAllMotorcycles
};
