"use strict";
// 全局事件存储
const timeEvents = {};
module.exports.timeEvents = timeEvents;

function scheduleEvent(name, timeInfo, callback) {
  // 初始化剩余秒数，便于倒计时逻辑
  const info = {
    ...timeInfo,
    remainingSec: typeof timeInfo.durationSec === 'number' ? timeInfo.durationSec : 0
  };
  const event = {
    timeInfo: info,
    callback,
    paused: false,
    interval: null
  };
  event.interval = setInterval(() => {
    if (!event.paused && event.timeInfo.remainingSec > 0) {
      event.timeInfo.remainingSec -= 1;
      if (event.timeInfo.remainingSec <= 0) {
        clearInterval(event.interval);
        if (typeof event.callback === 'function') {
          event.callback();
        }
      }
    }
  }, 1000);
  timeEvents[name] = event;
  return event;
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

// 编辑事件时修改持续时长
async function editEvent(name, durationSec) {
  const ev = timeEvents[name];
  if (!ev || !ev.timeInfo) return null;
  ev.timeInfo.durationSec = durationSec;
  // 如果存在 remainingSec，更新为新的值
  ev.timeInfo.remainingSec = durationSec;
  return ev.timeInfo;
}

// 获取事件当前状态
async function getEventState(name) {
  const ev = timeEvents[name];
  if (!ev || !ev.timeInfo) {
    return { label: '', remainingSec: 0, state: 'unknown' };
  }
  const { label, durationSec, remainingSec, paused } = ev.timeInfo;
  return {
    label,
    remainingSec: (typeof remainingSec === 'number' ? remainingSec : durationSec),
    state: paused ? 'paused' : 'running'
  };
}

// 获取当前服务器时间
function getNow() {
  return new Date().toISOString();
}

module.exports = {
  timeEvents,
  scheduleEvent,
  pauseEvent,
  resumeEvent,
  getFixedTimeData,
  editEvent,
  getEventState,
  getNow
}; 