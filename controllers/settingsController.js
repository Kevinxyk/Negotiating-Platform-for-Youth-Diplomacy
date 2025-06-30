"use strict";
const settingsService = require("../services/settingsService");

function getSettings(req, res) {
  const userId = req.user ? req.user.userId : req.params.userId;
  res.json(settingsService.getSettings(userId));
}

function updateSettings(req, res) {
  const userId = req.user ? req.user.userId : req.params.userId;
  const updated = settingsService.updateSettings(userId, req.body || {});
  res.json(updated);
}

module.exports = { getSettings, updateSettings };
