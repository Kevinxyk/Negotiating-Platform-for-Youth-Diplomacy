// File: my-backend/services/timeService.js
"use strict";

const { timeEvents } = require('../data/timeData');
const eventBus = require('./eventBus');

/**
 * 获取当前时间 ISO 格式
 */
function getNow() {
  return new Date().toISOString();
}

/**
 * 获取事件当前状态和剩余秒数
 */
function getEventState(eventKey) {
  const evt = timeEvents[eventKey];
  if (!evt) return null;
  const remaining = evt.state === 'paused'
    ? evt.remainingSec
    : Math.max(0, Math.floor((new Date(evt.targetTime).getTime() - Date.now()) / 1000));
  return { label: evt.label, state: evt.state, remainingSec: remaining };
}

/**
 * 调度/启动一个新倒计时
 */
function scheduleEvent(eventKey, label, durationSec) {
  cancelEventTimer(eventKey);
  const now = Date.now();
  const evt = {
    label,
    durationSec,
    targetTime: new Date(now + durationSec * 1000).toISOString(),
    remainingSec: durationSec,
    state: 'running',
    timer: null
  };
  evt.timer = setTimeout(() => {
    eventBus.emit('timeEnd', eventKey);
  }, durationSec * 1000);
  timeEvents[eventKey] = evt;
}

/**
 * 暂停倒计时
 */
function pauseEvent(eventKey) {
  const evt = timeEvents[eventKey];
  if (evt && evt.state === 'running') {
    const rem = Math.floor((new Date(evt.targetTime).getTime() - Date.now()) / 1000);
    evt.remainingSec = rem;
    evt.state = 'paused';
    clearTimeout(evt.timer);
  }
}

/**
 * 恢复倒计时
 */
function resumeEvent(eventKey) {
  const evt = timeEvents[eventKey];
  if (evt && evt.state === 'paused') {
    evt.targetTime = new Date(Date.now() + evt.remainingSec * 1000).toISOString();
    evt.state = 'running';
    evt.timer = setTimeout(() => {
      eventBus.emit('timeEnd', eventKey);
    }, evt.remainingSec * 1000);
  }
}

/**
 * 取消已存在的定时器
 */
function cancelEventTimer(eventKey) {
  const evt = timeEvents[eventKey];
  if (evt && evt.timer) {
    clearTimeout(evt.timer);
    evt.timer = null;
  }
}

/**
 * 编辑倒计时总时长并重启
 */
function editEvent(eventKey, newDurationSec) {
  const evt = timeEvents[eventKey];
  if (evt) {
    scheduleEvent(eventKey, evt.label, newDurationSec);
  }
}

module.exports = { getNow, getEventState, scheduleEvent, pauseEvent, resumeEvent, editEvent };
