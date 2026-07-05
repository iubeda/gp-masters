const championshipModel = require('../models/championship.model');
const teamModel = require('../models/team.model');
const db = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');

const createChampionship = asyncHandler(async (req, res) => {
  const { name, season, start_date, is_public, pin } = req.body;
  const createdBy = req.user.email;
  const userRole = req.user.role || 'player';

  if (userRole === 'player') {
    return res.status(403).json({ error: 'Players are not allowed to create championships.' });
  }

  const isPublic = is_public !== false && is_public !== 'false';
  
  if (userRole === 'manager' && !isPublic) {
    return res.status(403).json({ error: 'Managers are only allowed to create public championships.' });
  }

  const privatePin = isPublic ? null : pin;

  const championship = await championshipModel.create(name, season, start_date, createdBy, isPublic, privatePin);
  res.status(201).json(championship);
});

const getChampionships = asyncHandler(async (req, res) => {
  const userEmail = req.user.email;
  const championships = await championshipModel.findAll(userEmail);
  
  // We need to fetch and set kick status for each championship in list
  for (const champ of championships) {
    const teamRes = await db.query(
      'SELECT is_kicked FROM teams WHERE user_email = $1 AND championship_id = $2',
      [userEmail, champ.id]
    );
    champ.is_kicked = teamRes.rows.length > 0 ? teamRes.rows[0].is_kicked : false;
  }

  res.json(championships);
});

const getChampionshipDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const championship = await championshipModel.findById(id);

  if (!championship) {
    return res.status(404).json({ error: 'Championship not found.' });
  }

  const userEmail = req.user.email;
  const isAdmin = req.user.role === 'admin';

  // Check user's registration and kick status
  const userTeamRes = await db.query(
    'SELECT is_kicked, kick_reason FROM teams WHERE user_email = $1 AND championship_id = $2',
    [userEmail, id]
  );
  const userTeam = userTeamRes.rows[0];
  const isKicked = userTeam ? userTeam.is_kicked : false;
  const isMember = userTeam ? !userTeam.is_kicked : false;

  championship.kicked = isKicked;
  championship.kick_reason = userTeam ? userTeam.kick_reason : null;

  // Visibility Check: private championship
  if (!championship.is_public && !isMember && !isAdmin) {
    // Hide circuits list/calendar
    championship.circuits = [];
    return res.json(championship);
  }

  // Fetch circuits calendar with calculated dates
  const circuits = await championshipModel.findCalendarCircuits(id, championship.start_date);
  championship.circuits = circuits;

  res.json(championship);
});

const addCalendarCircuit = asyncHandler(async (req, res) => {
  const { championship_id, circuit_id, order } = req.body;
  const currentUser = req.user.email;
  const userRole = req.user.role;

  // 1. Fetch championship to check creator permissions
  const championship = await championshipModel.findById(championship_id);
  if (!championship) {
    return res.status(404).json({ error: 'Championship not found.' });
  }

  const createdBy = championship.created_by;
  const isAdmin = userRole === 'admin';
  const isCreator = createdBy && createdBy.toLowerCase() === currentUser.toLowerCase();

  if (!isCreator && !isAdmin) {
    return res.status(403).json({ error: 'Only the championship creator or an administrator can define the calendar and race order.' });
  }

  // 2. Validation: ensure no more than 15 circuits are added
  const circuitCount = await championshipModel.countCircuits(championship_id);
  if (circuitCount >= 15) {
    return res.status(400).json({ error: 'Championship calendar is full (max 15 circuits)' });
  }

  // 3. Add mapping
  const mapping = await championshipModel.addCircuit(championship_id, circuit_id, order);
  res.status(201).json(mapping);
});

const kickUser = asyncHandler(async (req, res) => {
  const { id } = req.params; // championship id
  const { team_id, reason } = req.body;
  const currentUser = req.user.email;
  const currentRole = req.user.role;

  if (!team_id) {
    return res.status(400).json({ error: 'El ID del equipo a expulsar es obligatorio.' });
  }

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'El motivo de la expulsión es obligatorio.' });
  }

  // Fetch championship details
  const championship = await championshipModel.findById(id);
  if (!championship) {
    return res.status(404).json({ error: 'Championship not found.' });
  }

  // Authorize: Admin can kick anyone. Creator can kick before championship has started.
  if (currentRole !== 'admin') {
    // Check if they created the championship
    if (!championship.created_by || championship.created_by.toLowerCase() !== currentUser.toLowerCase()) {
      return res.status(403).json({ error: 'Solo el creador del campeonato puede expulsar usuarios.' });
    }

    // Check if the championship has started (at least one GP completed)
    const startedRes = await db.query(
      "SELECT COUNT(*)::int FROM race_weekends WHERE championship_id = $1 AND status = 'completed'",
      [id]
    );
    if (startedRes.rows[0].count > 0) {
      return res.status(400).json({ error: 'No se pueden expulsar usuarios una vez comenzadas las carreras.' });
    }
  }

  // Check if target team exists in this championship
  const teamRes = await db.query(
    'SELECT id, is_kicked, user_email FROM teams WHERE id = $1 AND championship_id = $2',
    [team_id, id]
  );
  if (teamRes.rows.length === 0) {
    return res.status(404).json({ error: 'El equipo no está inscrito en este campeonato.' });
  }

  const targetEmail = teamRes.rows[0].user_email;

  if (targetEmail.toLowerCase() === currentUser.toLowerCase()) {
    return res.status(400).json({ error: 'No puedes expulsarte a ti mismo del campeonato.' });
  }

  if (teamRes.rows[0].is_kicked) {
    return res.status(400).json({ error: 'El equipo ya ha sido expulsado de este campeonato.' });
  }

  // Perform kick
  await db.query(
    'UPDATE teams SET is_kicked = TRUE, kick_reason = $1 WHERE id = $2',
    [reason.trim(), team_id]
  );

  res.json({ message: 'Usuario expulsado correctamente con el motivo especificado.' });
});

module.exports = {
  createChampionship,
  getChampionships,
  getChampionshipDetail,
  addCalendarCircuit,
  kickUser
};
