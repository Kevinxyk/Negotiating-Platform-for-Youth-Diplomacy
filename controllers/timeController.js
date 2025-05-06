// File: my-backend/controllers/timeController.js
"use strict";
const timeService = require('../services/timeService');

// GET /api/time/now
async function getCurrentTime(req, res) {
  try {
    const now = timeService.getNow();
    res.json({ now });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/time/:event/state
async function getEventState(req, res) {
  try {
    const { eventKey } = req.params;
    const state = timeService.getEventState(eventKey);
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/time/:event/schedule  body {label,durationSec}
async function scheduleEvent(req, res) {
  try {
    const { eventKey } = req.params;
    const { label, durationSec } = req.body;
    const event = timeService.scheduleEvent(eventKey, label, durationSec);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/time/:event/pause
async function pauseEvent(req, res) {
  try {
    const { eventKey } = req.params;
    const event = timeService.pauseEvent(eventKey);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/time/:event/resume
async function resumeEvent(req, res) {
  try {
    const { eventKey } = req.params;
    const event = timeService.resumeEvent(eventKey);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/time/:event/edit body {durationSec}
async function editEvent(req, res) {
  try {
    const { eventKey } = req.params;
    const { durationSec } = req.body;
    const event = timeService.editEvent(eventKey, durationSec);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getCurrentTime,
  getEventState,
  scheduleEvent,
  pauseEvent,
  resumeEvent,
  editEvent
};
