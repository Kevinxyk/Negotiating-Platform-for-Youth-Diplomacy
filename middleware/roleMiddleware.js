// File: my-backend/middleware/roleMiddleware.js
"use strict";

/**
 * Simple role-based middleware using x-user-role header
 */
function requireRoles(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const role = req.user.role;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

module.exports = { requireRoles };