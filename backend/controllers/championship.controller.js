const championshipModel = require('../models/championship.model');
const teamModel = require('../models/team.model');
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { encrypt, decrypt } = require('../utils/encryption');
const asyncHandler = require('../utils/asyncHandler');

const createChampionship = asyncHandler(async (req, res) => {
  const { name, season, start_date, is_public, pin, max_circuits, max_teams, time_restricted } = req.body;
  const createdBy = req.user.email;
  const userRole = req.user.role || 'player';

  if (userRole === 'player') {
    return res.status(403).json({ error: 'Players are not allowed to create championships.', error_code: 'PLAYERS_ARE_NOT_ALLOWED_TO_CRE' });
  }

  const isPublic = is_public !== false && is_public !== 'false';
  
  if (userRole === 'manager' && !isPublic) {
    return res.status(403).json({ error: 'Managers are only allowed to create public championships.', error_code: 'MANAGERS_ARE_ONLY_ALLOWED_TO_C' });
  }

  // Validate max_circuits (2–15)
  const parsedMaxCircuits = parseInt(max_circuits) || 15;
  if (parsedMaxCircuits < 2 || parsedMaxCircuits > 15) {
    return res.status(400).json({ error: 'El número máximo de carreras debe estar entre 2 y 15.', error_code: 'EL_N_MERO_M_XIMO_DE_CARRERAS_D' });
  }

  // Validate max_teams (2–12)
  const parsedMaxTeams = parseInt(max_teams) || 10;
  if (parsedMaxTeams < 2 || parsedMaxTeams > 12) {
    return res.status(400).json({ error: 'El número máximo de participantes debe estar entre 2 y 12.', error_code: 'EL_N_MERO_M_XIMO_DE_PARTICIPAN' });
  }

  // Validate time_restricted (boolean)
  const isTimeRestricted = time_restricted !== false && time_restricted !== 'false';

  // Encrypt PIN for private championships so creator can see it later
  let encryptedPin = null;
  if (!isPublic && pin) {
    encryptedPin = encrypt(pin);
  }

  const championship = await championshipModel.create(
    name, season, start_date, createdBy, isPublic, encryptedPin,
    parsedMaxCircuits, parsedMaxTeams, isTimeRestricted
  );
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
    champ.pin = null; // Hide PIN in the general list endpoint
  }

  res.json(championships);
});

const getChampionshipDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const championship = await championshipModel.findById(id);

  if (!championship) {
    return res.status(404).json({ error: 'Championship not found.', error_code: 'CHAMPIONSHIP_NOT_FOUND' });
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
    championship.pin = null;
    return res.json(championship);
  }

  // Only expose decrypted PIN to creator and admin
  const isCreator = championship.created_by && championship.created_by.toLowerCase() === userEmail.toLowerCase();
  if (championship.pin && (isCreator || isAdmin)) {
    championship.pin = decrypt(championship.pin);
  } else {
    championship.pin = null;
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
    return res.status(404).json({ error: 'Championship not found.', error_code: 'CHAMPIONSHIP_NOT_FOUND' });
  }

  const createdBy = championship.created_by;
  const isAdmin = userRole === 'admin';
  const isCreator = createdBy && createdBy.toLowerCase() === currentUser.toLowerCase();

  if (!isCreator && !isAdmin) {
    return res.status(403).json({ error: 'Only the championship creator or an administrator can define the calendar and race order.', error_code: 'ONLY_THE_CHAMPIONSHIP_CREATOR_' });
  }

  // 2. Validation: ensure no more than max_circuits are added
  const circuitCount = await championshipModel.countCircuits(championship_id);
  if (circuitCount >= championship.max_circuits) {
    return res.status(400).json({ error: `El calendario del campeonato está completo (máx. ${championship.max_circuits} circuitos)`, error_code: 'CALENDAR_FULL' });
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
    return res.status(400).json({ error: 'El ID del equipo a expulsar es obligatorio.', error_code: 'EL_ID_DEL_EQUIPO_A_EXPULSAR_ES' });
  }

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'El motivo de la expulsión es obligatorio.', error_code: 'EL_MOTIVO_DE_LA_EXPULSI_N_ES_O' });
  }

  // Fetch championship details
  const championship = await championshipModel.findById(id);
  if (!championship) {
    return res.status(404).json({ error: 'Championship not found.', error_code: 'CHAMPIONSHIP_NOT_FOUND' });
  }

  // Authorize: Admin can kick anyone. Creator can kick before championship has started.
  if (currentRole !== 'admin') {
    // Check if they created the championship
    if (!championship.created_by || championship.created_by.toLowerCase() !== currentUser.toLowerCase()) {
      return res.status(403).json({ error: 'Solo el creador del campeonato puede expulsar usuarios.', error_code: 'SOLO_EL_CREADOR_DEL_CAMPEONATO' });
    }

    // Check if the championship has started (at least one GP completed)
    const startedRes = await db.query(
      "SELECT COUNT(*)::int FROM race_weekends WHERE championship_id = $1 AND status = 'completed'",
      [id]
    );
    if (startedRes.rows[0].count > 0) {
      return res.status(400).json({ error: 'No se pueden expulsar usuarios una vez comenzadas las carreras.', error_code: 'NO_SE_PUEDEN_EXPULSAR_USUARIOS' });
    }
  }

  // Check if target team exists in this championship
  const teamRes = await db.query(
    'SELECT id, is_kicked, user_email FROM teams WHERE id = $1 AND championship_id = $2',
    [team_id, id]
  );
  if (teamRes.rows.length === 0) {
    return res.status(404).json({ error: 'El equipo no está inscrito en este campeonato.', error_code: 'EL_EQUIPO_NO_EST_INSCRITO_EN_E' });
  }

  const targetEmail = teamRes.rows[0].user_email;

  if (targetEmail.toLowerCase() === currentUser.toLowerCase()) {
    return res.status(400).json({ error: 'No puedes expulsarte a ti mismo del campeonato.', error_code: 'NO_PUEDES_EXPULSARTE_A_TI_MISM' });
  }

  if (championship.created_by && targetEmail.toLowerCase() === championship.created_by.toLowerCase()) {
    return res.status(400).json({ error: 'No se puede expulsar al creador del campeonato.', error_code: 'NO_SE_PUEDE_EXPULSAR_AL_CREADO' });
  }

  const disputedRes = await db.query(
    "SELECT COUNT(*)::int FROM gp_team_status WHERE team_id = $1 AND (finishing_position IS NOT NULL OR status IN ('finished', 'DNF_crash'))",
    [team_id]
  );
  if (disputedRes.rows[0].count > 0) {
    return res.status(400).json({ error: 'No se puede expulsar a un usuario que ya ha disputado una carrera.', error_code: 'NO_SE_PUEDE_EXPULSAR_A_UN_USUA' });
  }

  if (teamRes.rows[0].is_kicked) {
    return res.status(400).json({ error: 'El equipo ya ha sido expulsado de este campeonato.', error_code: 'EL_EQUIPO_YA_HA_SIDO_EXPULSADO' });
  }

  // Perform kick
  await db.query(
    'UPDATE teams SET is_kicked = TRUE, kick_reason = $1 WHERE id = $2',
    [reason.trim(), team_id]
  );

  res.json({ message: 'Usuario expulsado correctamente con el motivo especificado.' });
});

const toggleBypass = asyncHandler(async (req, res) => {
  const { id, circuitId } = req.params;
  const { status } = req.body;
  const currentUser = req.user.email;
  const userRole = req.user.role;

  const championship = await championshipModel.findById(id);
  if (!championship) {
    return res.status(404).json({ error: 'Championship not found.', error_code: 'CHAMPIONSHIP_NOT_FOUND' });
  }

  const createdBy = championship.created_by;
  const isAdmin = userRole === 'admin';
  const isCreator = createdBy && createdBy.toLowerCase() === currentUser.toLowerCase();

  if (!isCreator && !isAdmin) {
    return res.status(403).json({ error: 'Solo el creador o un administrador puede habilitar el Bypass Global.', error_code: 'SOLO_EL_CREADOR_O_UN_ADMINISTR' });
  }

  const updated = await championshipModel.toggleCircuitBypass(id, circuitId, status === true || status === 'true');
  if (!updated) {
    return res.status(404).json({ error: 'Circuit not found in the championship calendar.', error_code: 'CIRCUIT_NOT_FOUND_IN_THE_CHAMP' });
  }

  res.json({ message: 'Bypass status updated successfully.', bypass_restrictions: updated.bypass_restrictions });
});

module.exports = {
  createChampionship,
  getChampionships,
  getChampionshipDetail,
  addCalendarCircuit,
  kickUser,
  toggleBypass
};
