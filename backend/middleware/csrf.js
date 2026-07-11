const logger = require('../utils/logger');

const csrfProtection = (req, res, next) => {
  // Skip CSRF protection in test environment
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  // Safe methods do not require CSRF protection
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Enforce custom header for state-changing requests
  const requestedWith = req.headers['x-requested-with'];
  if (!requestedWith || requestedWith !== 'XMLHttpRequest') {
    logger.warn(`CSRF attempt detected or missing header on ${req.method} ${req.url}`);
    return res.status(403).json({ error: 'Forbidden: Missing or invalid CSRF custom header.' });
  }

  next();
};

module.exports = csrfProtection;
