module.exports = (err, req, res, next) => {
  console.error('API Error Catch:', err.message || err);

  // Catch database constraint violations
  if (err.code === '23505') {
    const constraint = err.constraint;
    if (constraint === 'users_pkey' || constraint === 'idx_users_username_lower') {
      return res.status(400).json({ error: 'Registration failed. Username or email may already be in use.' });
    }
    if (constraint === 'unique_user_championship') {
      return res.status(400).json({ error: 'You have already registered a team in this championship.' });
    }
    if (constraint === 'unique_championship_pilot') {
      return res.status(400).json({ error: 'This pilot is already hired by another team in this championship.' });
    }
    return res.status(400).json({ error: 'Conflict: Unique constraint violation.' });
  }

  if (err.code === '23503') {
    const constraint = err.constraint;
    if (constraint === 'championships_created_by_fkey' || constraint === 'teams_user_email_fkey') {
      return res.status(401).json({ error: 'Your session user does not exist in the database. Please log out and register again.' });
    }
    return res.status(400).json({ error: 'Associated referenced resource does not exist in the database.' });
  }

  const statusCode = err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const errMessage = statusCode === 500 && isProduction 
    ? 'Internal server error.' 
    : (err.message || 'Internal server error.');
  res.status(statusCode).json({ error: errMessage });
};
