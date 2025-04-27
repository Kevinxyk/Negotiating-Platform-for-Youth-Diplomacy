// File: my-backend/middleware/roleMiddleware.js
"use strict";

/**
 * Simple role-based middleware using x-user-role header
 */
function requireRoles(allowedRoles) {
  return (req, res, next) => {
    const role = req.header('x-user-role');
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

module.exports = { requireRoles };