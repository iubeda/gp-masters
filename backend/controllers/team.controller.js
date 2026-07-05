const teamModel = require('../models/team.model');
const championshipModel = require('../models/championship.model');
const db = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');

const registerTeam = asyncHandler(async (req, res) => {
  const { name, championship_id, pin } = req.body;
  const user_email = req.user.email;

  // Validate and clean team name
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'El nombre del equipo es obligatorio y debe ser texto.' });
  }

  const trimmedName = name.trim();

  // Length validation: 3 to 20 characters
  if (trimmedName.length < 3 || trimmedName.length > 20) {
    return res.status(400).json({ error: 'El nombre del equipo debe tener entre 3 y 20 caracteres.' });
  }

  // Regex validation: alphanumeric, underscores, dots
  const nameRegex = /^[a-zA-Z0-9_.]+$/;
  if (!nameRegex.test(trimmedName)) {
    return res.status(400).json({ error: 'El nombre del equipo solo puede contener caracteres alfanuméricos, guiones bajos (_) y puntos (.).' });
  }

  // Duplicate team name check in the same championship (case-insensitive)
  const duplicateCheck = await db.query(
    'SELECT id FROM teams WHERE championship_id = $1 AND LOWER(name) = LOWER($2)',
    [championship_id, trimmedName]
  );
  if (duplicateCheck.rows.length > 0) {
    return res.status(400).json({ error: 'Ya existe un equipo con ese nombre en este campeonato.' });
  }

  // Verify PIN for private championships
  const championship = await championshipModel.findById(championship_id);
  if (!championship) {
    return res.status(404).json({ error: 'Championship not found.' });
  }

  if (championship.is_public === false || championship.is_public === 'false') {
    if (!pin) {
      return res.status(400).json({ error: 'A PIN is required to register in this private championship.' });
    }
    if (pin !== championship.pin) {
      return res.status(400).json({ error: 'Incorrect PIN. Registration denied.' });
    }
  }

  // 1. Validation: count existing teams in this championship
  const teamCount = await teamModel.countTeams(championship_id);
  if (teamCount >= 10) {
    return res.status(400).json({ error: 'Championship is full' });
  }

  // 2. Validation: check if user already has a team in this championship (active or kicked)
  const userTeamRes = await db.query(
    'SELECT is_kicked FROM teams WHERE user_email = $1 AND championship_id = $2',
    [user_email, championship_id]
  );
  if (userTeamRes.rows.length > 0) {
    if (userTeamRes.rows[0].is_kicked) {
      return res.status(400).json({ error: 'Fuiste expulsado de este campeonato y no puedes volver a inscribirte.' });
    }
    return res.status(400).json({ error: 'You have already registered a team in this championship.' });
  }

  // 3. Find pilots already registered in this championship
  const takenPilotIds = await teamModel.findRegisteredPilots(championship_id);

  // 4. Fetch all pilots and filter available
  const allPilots = await teamModel.findAllPilots();
  const availablePilots = allPilots.filter(p => !takenPilotIds.includes(p.id));

  if (availablePilots.length === 0) {
    return res.status(400).json({ error: 'No available pilots left for this championship.' });
  }

  // 5. Assign a random pilot
  const randomIdx = Math.floor(Math.random() * availablePilots.length);
  const assignedPilot = availablePilots[randomIdx];

  // 6. Assign a random motorcycle from the predefined catalog
  const motorcycles = await teamModel.findAllMotorcycles();
  if (motorcycles.length === 0) {
    return res.status(400).json({ error: 'No motorcycles registered in catalog.' });
  }
  const randomMotorcycle = motorcycles[Math.floor(Math.random() * motorcycles.length)];

  // 7. Insert the team record
  const team = await teamModel.createTeam(
    trimmedName, 
    user_email, 
    championship_id, 
    assignedPilot.id,
    randomMotorcycle.id
  );

  res.status(201).json({
    message: 'Team registered successfully.',
    team,
    assigned_pilot_name: assignedPilot.name,
    assigned_motorcycle_name: randomMotorcycle.model_name
  });
});

const getChampionshipTeams = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const current_user = req.user.email;
  const isAdmin = req.user.role === 'admin';

  // Check if the current user belongs to the championship (has a team registered and not kicked)
  const userTeamRes = await db.query(
    'SELECT is_kicked FROM teams WHERE user_email = $1 AND championship_id = $2',
    [current_user, id]
  );
  const hasTeam = userTeamRes.rows.length > 0;
  const isKicked = hasTeam ? userTeamRes.rows[0].is_kicked : false;
  const isMember = hasTeam && !isKicked;

  if (!isMember && !isAdmin) {
    // User is not an active member, return empty list of teams (visibility constraint)
    return res.json([]);
  }

  const resultTeams = await teamModel.findRegisteredTeams(id);

  // Redaction logic: Hide pilot & motorcycle attributes of rival teams, and hide rival emails
  const redactedTeams = resultTeams.map((team) => {
    const isOwner = team.user_email.toLowerCase() === current_user.toLowerCase() || isAdmin;
    if (isOwner) {
      return team; // Keep all stats and email for owner or Admin
    } else {
      return {
        id: team.id,
        team_name: team.team_name,
        owner_name: team.owner_name,
        pilot_id: team.pilot_id,
        pilot_name: team.pilot_name,
        motorcycle_name: team.motorcycle_name,
        total_points: team.total_points,
        user_email: null, // Hide email address
        is_kicked: team.is_kicked,
        kick_reason: team.is_kicked ? team.kick_reason : null,
        talent: null,
        consistency: null,
        aggressiveness: null,
        experience: null,
        fitness: null,
        engine: null,
        gearbox: null,
        suspension: null,
        chassis: null,
        wings: null,
        is_redacted: true
      };
    }
  });

  res.json(redactedTeams);
});

const getPilots = asyncHandler(async (req, res) => {
  // Return all pilots with detailed stats
  const result = await db.query('SELECT * FROM dictionary_pilots ORDER BY name ASC');
  res.json(result.rows);
});

const getCircuits = asyncHandler(async (req, res) => {
  // Return all circuits with detailed stats
  const result = await db.query('SELECT * FROM dictionary_circuits ORDER BY name ASC');
  res.json(result.rows);
});

module.exports = {
  registerTeam,
  getChampionshipTeams,
  getPilots,
  getCircuits
};
