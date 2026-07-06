const jwt = require('jsonwebtoken');
const db = require('../config/database');
require('dotenv').config();

module.exports = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validate token version against database (token revocation mechanism)
    const userRes = await db.query(
      'SELECT token_version FROM users WHERE email = $1',
      [decoded.email]
    );
    
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'User not found.' });
    }
    
    const currentTokenVersion = userRes.rows[0].token_version || 0;
    const tokenVersionInJWT = decoded.tokenVersion || 0;
    
    if (tokenVersionInJWT !== currentTokenVersion) {
      return res.status(401).json({ error: 'Token has been revoked. Please log in again.' });
    }
    
    // Attach decoded user info (contains email) to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
