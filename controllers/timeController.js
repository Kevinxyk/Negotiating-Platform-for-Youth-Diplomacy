// File: my-backend/controllers/timeController.js
"use strict";

const {
  getNow,
  getEventState,
  scheduleEvent,
  pauseEvent,
  resumeEvent,
  editEvent
} = require('../services/timeService');

// GET /api/time/now
function nowHandler(req, res) {
  res.json({ now: getNow() });
}

// GET /api/time/:event/state
function stateHandler(req, res) {
  const eventKey = req.params.event;
  const state = getEventState(eventKey);
  if (!state) return res.status(404).json({ error: 'Event not found' });
  res.json(state);
}

// POST /api/time/:event/schedule  body {label,durationSec}
function scheduleHandler(req, res) {
  // TODO: 校验 req.user.role
  const eventKey = req.params.event;
  const { label, durationSec } = req.body;
  if (!label || !durationSec) return res.status(400).json({ error: 'label and durationSec required' });
  scheduleEvent(eventKey, label, durationSec);
  res.status(201).json({ status: 'scheduled' });
}

// POST /api/time/:event/pause
function pauseHandler(req, res) {
  // TODO: 校验 req.user.role
  const eventKey = req.params.event;
  pauseEvent(eventKey);
  res.json({ status: 'paused' });
}

// POST /api/time/:event/resume
function resumeHandler(req, res) {
  // TODO: 校验 req.user.role
  const eventKey = req.params.event;
  resumeEvent(eventKey);
  res.json({ status: 'running' });
}

// POST /api/time/:event/edit body {durationSec}
function editHandler(req, res) {
  // TODO: 校验 req.user.role
  const eventKey = req.params.event;
  const { durationSec } = req.body;
  if (!durationSec) return res.status(400).json({ error: 'durationSec required' });
  editEvent(eventKey, durationSec);
  res.json({ status: 'edited' });
}

module.exports = {
  nowHandler,
  stateHandler,
  scheduleHandler,
  pauseHandler,
  resumeHandler,
  editHandler
};
