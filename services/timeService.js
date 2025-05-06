"use strict";
// 全局事件存储
const timeEvents = {};
module.exports.timeEvents = timeEvents;

function scheduleEvent(name, timeInfo, callback) {
  timeEvents[name] = { timeInfo, callback, paused: false };
  return true;
}

function pauseEvent(name) {
  if (!timeEvents[name]) return false;
  timeEvents[name].paused = true;
  return true;
}

function resumeEvent(name) {
  if (!timeEvents[name]) return false;
  timeEvents[name].paused = false;
  return true;
}

const { timeData } = require("../data/timeData");
function getFixedTimeData() {
  return timeData;
}

module.exports = {
  timeEvents,
  scheduleEvent,
  pauseEvent,
  resumeEvent,
  getFixedTimeData
}; 