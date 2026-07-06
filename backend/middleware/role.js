const db = require('../config/database');

const checkRole = (allowedRoles, revalidateFromDB = false) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Unauthorized. User information is missing.' });
    }
    
    let userRole = req.user.role;
    
    // For critical admin routes, re-validate role from database (security: prevent stale JWT roles)
    if (revalidateFromDB) {
      try {
        const userRes = await db.query(
          'SELECT role FROM users WHERE email = $1',
          [req.user.email]
        );
        
        if (userRes.rows.length === 0) {
          return res.status(401).json({ error: 'User not found.' });
        }
        
        userRole = userRes.rows[0].role;
        req.user.role = userRole; // Update role in request object
      } catch (error) {
        console.error('Role validation error:', error.message);
        return res.status(500).json({ error: 'Internal server error during role validation.' });
      }
    }
    
    const hasRole = allowedRoles.includes(userRole.toLowerCase());
    if (!hasRole) {
      return res.status(403).json({ error: 'Access denied. You do not have the required permissions.' });
    }
    
    next();
  };
};

module.exports = checkRole;
