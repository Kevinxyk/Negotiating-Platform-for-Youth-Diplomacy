// File: my-backend/controllers/timezoneController.js
"use strict";

const { getAllTimezones } = require('../services/timezoneService');

/**
 * 列出所有时区
 */
function listTimezones(req, res) {
  const zones = getAllTimezones();
  res.json(zones);
}

module.exports = { listTimezones };