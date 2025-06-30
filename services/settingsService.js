"use strict";

const defaultSettings = {
  theme: "light",
  fontSize: 14,
  bubbleStyle: "default",
  language: "en",
  timezone: "Europe/Paris",
  lineBreakKey: "Enter"
};

const userSettings = {};

function getSettings(userId) {
  return { ...defaultSettings, ...(userSettings[userId] || {}) };
}

function updateSettings(userId, updates) {
  userSettings[userId] = { ...getSettings(userId), ...updates };
  return getSettings(userId);
}

function clearSettings(userId) {
  delete userSettings[userId];
}

module.exports = {
  getSettings,
  updateSettings,
  clearSettings,
  defaultSettings
};
