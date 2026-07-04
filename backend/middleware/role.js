const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Unauthorized. Role information is missing.' });
    }
    
    const hasRole = allowedRoles.includes(req.user.role.toLowerCase());
    if (!hasRole) {
      return res.status(403).json({ error: 'Access denied. You do not have the required permissions.' });
    }
    
    next();
  };
};

module.exports = checkRole;
