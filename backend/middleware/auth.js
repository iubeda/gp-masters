const jwt = require('jsonwebtoken');
const db = require('../config/database');
const logger = require('../utils/logger');
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

    const unverifiedDecoded = jwt.decode(token);
    if (!unverifiedDecoded) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    let decoded;
    let isSupabaseToken = false;

    // Check if it's a Supabase token by looking at the issuer
    if (unverifiedDecoded.iss && unverifiedDecoded.iss.includes('supabase.co')) {
      isSupabaseToken = true;
      if (!process.env.SUPABASE_JWT_SECRET) {
        // If SUPABASE_JWT_SECRET is not available, we can try using Supabase client to get the user
        const { createClient } = require('@supabase/supabase-js');
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
          return res.status(500).json({ error: 'Server configuration error: Missing Supabase Env Vars' });
        }
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) {
          return res.status(401).json({ error: 'Invalid Supabase token' });
        }
        decoded = { email: data.user.email };
      } else {
        try {
          decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET, { algorithms: ['HS256', 'RS256'] });
        } catch (e) {
          if (e.message === 'invalid algorithm' || e.message === 'invalid signature') {
             // Fallback to supabase client if JWT secret verification fails (due to RS256 or wrong secret)
             const { createClient } = require('@supabase/supabase-js');
             if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
               throw e;
             }
             const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
             const { data, error } = await supabase.auth.getUser(token);
             if (error || !data.user) {
               return res.status(401).json({ error: 'Invalid Supabase token' });
             }
             decoded = { email: data.user.email };
          } else {
             throw e;
          }
        }
      }
    } else {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    }
    
    // Ensure email is present
    const email = decoded.email;
    if (!email) {
      return res.status(401).json({ error: 'Invalid token format.' });
    }

    // Validate token version against database for local tokens
    const userRes = await db.query(
      'SELECT token_version FROM users WHERE email = $1',
      [email]
    );
    
    if (userRes.rows.length === 0) {
      if (isSupabaseToken && req.originalUrl.includes('/sync')) {
        // This is a new Supabase user trying to sync their profile, allow them through
        req.user = { email: email, role: 'manager' };
        return next();
      }
      return res.status(401).json({ error: 'User not found.' });
    }
    
    if (!isSupabaseToken) {
      const currentTokenVersion = userRes.rows[0].token_version || 0;
      const tokenVersionInJWT = decoded.tokenVersion || 0;
      
      if (tokenVersionInJWT !== currentTokenVersion) {
        return res.status(401).json({ error: 'Token has been revoked. Please log in again.' });
      }
    }
    
    // Attach decoded user info to request
    req.user = { email: email, role: unverifiedDecoded.role || 'manager' }; 
    // Supabase sets role to 'authenticated' by default in public schema if not configured, but our local users table has the real role.
    // Let's actually fetch the real role from the database to be safe.
    const roleRes = await db.query('SELECT role, username FROM users WHERE email = $1', [email]);
    if (roleRes.rows.length > 0) {
        req.user.role = roleRes.rows[0].role;
        req.user.username = roleRes.rows[0].username;
    }

    next();
  } catch (error) {
    logger.error(`JWT Verification Error: ${error.message}`);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
