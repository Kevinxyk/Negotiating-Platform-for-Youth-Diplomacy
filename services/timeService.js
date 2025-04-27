// File: my-backend/services/timeService.js
"use strict";

const { timeEvents } = require('../data/timeData');

function getNow() {
  return new Date().toISOString();
}

function getEventState(eventKey) {
  const evt = timeEvents[eventKey];
  if (!evt) return null;
  return {
    label: evt.label,
    state: evt.state,
    remainingSec: evt.state === 'paused' ? evt.remainingSec : Math.max(0, Math.floor((new Date(evt.targetTime).getTime() - Date.now())/1000))
  };
}

function scheduleEvent(eventKey, label, durationSec) {
  const now = Date.now();
  timeEvents[eventKey] = {
    label,
    durationSec,
    targetTime: new Date(now + durationSec*1000).toISOString(),
    remainingSec: durationSec,
    state: 'running'
  };
}

function pauseEvent(eventKey) {
  const evt = timeEvents[eventKey];
  if (evt && evt.state === 'running') {
    const rem = Math.floor((new Date(evt.targetTime).getTime() - Date.now())/1000);
    evt.remainingSec = rem;
    evt.state = 'paused';
  }
}

function resumeEvent(eventKey) {
  const evt = timeEvents[eventKey];
  if (evt && evt.state === 'paused') {
    evt.targetTime = new Date(Date.now() + evt.remainingSec*1000).toISOString();
    evt.state = 'running';
  }
}

function editEvent(eventKey, newDurationSec) {
  const evt = timeEvents[eventKey];
  if (evt) {
    evt.durationSec = newDurationSec;
    evt.targetTime = new Date(Date.now() + newDurationSec*1000).toISOString();
    evt.remainingSec = newDurationSec;
    evt.state = 'running';
  }
}

module.exports = { getNow, getEventState, scheduleEvent, pauseEvent, resumeEvent, editEvent };