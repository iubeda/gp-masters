const validateRegister = (req, res, next) => {
  let { email, username, password } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'All fields (email, username, password) are required.' });
  }

  // Trim whitespace and update req.body
  username = username.trim();
  req.body.username = username;

  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address format.' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
  }

  // Validate username length
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be between 3 and 20 characters long.' });
  }

  // Validate username characters (alphanumeric, underscore, hyphen)
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores, and hyphens.' });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  next();
};

const validateChampionship = (req, res, next) => {
  const { name, season, start_date, is_public, pin } = req.body;
  if (!name || !season || !start_date) {
    return res.status(400).json({ error: 'Championship name, season, and start date are required.' });
  }

  // Validate start_date is in the future
  const start = new Date(start_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  if (start <= today) {
    return res.status(400).json({ error: 'Start date must be in the future.' });
  }

  // Validate PIN if private
  if (is_public === false || is_public === 'false') {
    if (!pin) {
      return res.status(400).json({ error: 'A PIN is required for private championships.' });
    }
    const alphanumericRegex = /^[a-zA-Z0-9]{4,8}$/;
    if (!alphanumericRegex.test(pin)) {
      return res.status(400).json({ error: 'PIN must be between 4 and 8 characters long and contain only letters and numbers.' });
    }
  }
  next();
};

const validateTeam = (req, res, next) => {
  const { name, championship_id } = req.body;
  if (!name || !championship_id) {
    return res.status(400).json({ error: 'Team name and championship_id are required.' });
  }
  next();
};

const validateCalendar = (req, res, next) => {
  const { championship_id, circuit_id, order } = req.body;
  if (!championship_id || !circuit_id || order === undefined) {
    return res.status(400).json({ error: 'championship_id, circuit_id, and order are required.' });
  }
  next();
};

const validatePasswordUpdate = (req, res, next) => {
  const { new_password } = req.body;
  if (!new_password) {
    return res.status(400).json({ error: 'New password is required.' });
  }
  if (new_password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
  }
  next();
};

const validateSetupOffsets = (req, res, next) => {
  const { setup_engine, setup_gearbox, setup_suspension, setup_chassis, setup_wings } = req.body;
  const offsets = [setup_engine, setup_gearbox, setup_suspension, setup_chassis, setup_wings].map(Number);

  const sum = offsets.reduce((acc, v) => acc + v, 0);
  if (sum !== 0) {
    return res.status(400).json({ error: 'La suma de los offsets del setup debe ser exactamente 0.' });
  }
  if (offsets.some(v => v < -10 || v > 10)) {
    return res.status(400).json({ error: 'Los valores de setup deben estar entre -10 y +10.' });
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateChampionship,
  validateTeam,
  validateCalendar,
  validatePasswordUpdate,
  validateSetupOffsets,
};
