// File: my-backend/services/timezoneService.js
"use strict";

const { timezones } = require('../data/timezones');

/**
 * 返回所有时区列表
 */
function getAllTimezones() {
  return timezones;
}

module.exports = { getAllTimezones };
