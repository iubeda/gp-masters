const db = require('../config/database');

// Helper to add days to a date string (YYYY-MM-DD)
const addDays = (startDateStr, days) => {
  const date = new Date(startDateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const create = async (name, season, startDate, createdBy, isPublic = true, pin = null, maxCircuits = 15, maxTeams = 10, timeRestricted = true) => {
  const queryText = `
    INSERT INTO championships (name, season, start_date, created_by, is_public, pin, max_circuits, max_teams, time_restricted)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const result = await db.query(queryText, [name, season, startDate, createdBy, isPublic, pin, maxCircuits, maxTeams, timeRestricted]);
  return result.rows[0];
};

const findAll = async (userEmail) => {
  const queryText = `
    SELECT c.*, u.username AS creator_name,
      (SELECT COUNT(*)::int FROM teams t WHERE t.championship_id = c.id) AS team_count,
      (SELECT COUNT(*)::int FROM championship_circuits cc WHERE cc.championship_id = c.id) AS circuit_count,
      EXISTS(SELECT 1 FROM teams t WHERE t.championship_id = c.id AND t.user_email = $1) AS is_member
    FROM championships c
    LEFT JOIN users u ON c.created_by = u.email
    ORDER BY c.id DESC
  `;
  const result = await db.query(queryText, [userEmail]);
  return result.rows;
};

const findById = async (id) => {
  const queryText = `
    SELECT c.*, u.username AS creator_name,
      (SELECT COUNT(*)::int FROM teams t WHERE t.championship_id = c.id) AS team_count,
      (SELECT COUNT(*)::int FROM championship_circuits cc WHERE cc.championship_id = c.id) AS circuit_count
    FROM championships c
    LEFT JOIN users u ON c.created_by = u.email
    WHERE c.id = $1
  `;
  const result = await db.query(queryText, [id]);
  return result.rows[0] || null;
};

const findCalendarCircuits = async (championshipId, startDate) => {
  const queryText = `
    SELECT c.id, c.name, c.distance, c.curves_right, c.curves_left, c.curves_rects_ratio, c.asphalt_wear, cc.order,
           COALESCE(rw.status, 'scheduled') AS status
    FROM championship_circuits cc
    JOIN dictionary_circuits c ON cc.circuit_id = c.id
    LEFT JOIN race_weekends rw ON rw.championship_id = cc.championship_id AND rw.circuit_id = cc.circuit_id AND rw.session_type = 'race'
    WHERE cc.championship_id = $1
    ORDER BY cc.order ASC
  `;
  const result = await db.query(queryText, [championshipId]);
  
  // Calculate dynamic race dates (Day 1, 2, 3)
  return result.rows.map((circ) => {
    const orderIndex = circ.order - 1;
    const startDayOffset = orderIndex * 4;
    return {
      ...circ,
      practice_date: addDays(startDate, startDayOffset),
      qualifying_date: addDays(startDate, startDayOffset + 1),
      race_date: addDays(startDate, startDayOffset + 2),
    };
  });
};

const addCircuit = async (championshipId, circuitId, order) => {
  const queryText = `
    INSERT INTO championship_circuits (championship_id, circuit_id, "order")
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const result = await db.query(queryText, [championshipId, circuitId, order]);
  return result.rows[0];
};

const countCircuits = async (championshipId) => {
  const queryText = 'SELECT COUNT(*)::int FROM championship_circuits WHERE championship_id = $1';
  const result = await db.query(queryText, [championshipId]);
  return result.rows[0].count;
};

const countCompletedRaces = async (championshipId) => {
  const result = await db.query(
    "SELECT COUNT(*)::int FROM race_weekends WHERE championship_id = $1 AND session_type = 'race' AND status = 'completed'",
    [championshipId]
  );
  return result.rows[0].count;
};

const getKickStatus = async (userEmail, championshipId) => {
  const result = await db.query(
    'SELECT id, is_kicked, kick_reason FROM teams WHERE user_email = $1 AND championship_id = $2',
    [userEmail.toLowerCase(), championshipId]
  );
  return result.rows[0] || null;
};

module.exports = {
  create,
  findAll,
  findById,
  findCalendarCircuits,
  addCircuit,
  countCircuits,
  countCompletedRaces,
  getKickStatus,
};
