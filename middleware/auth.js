function checkRole(role) {
  return (req, res, next) => {
    const userRole = req.headers["x-user-role"];
    if (!userRole || userRole !== role) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    next();
  };
}

module.exports = { checkRole }; 