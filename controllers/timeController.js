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
    const eventName = req.params.event;
    const state = await timeService.getEventState(eventName);
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/time/:event/schedule  body {label,durationSec}
async function scheduleEvent(req, res) {
  try {
    const eventName = req.params.event;
    const { timeInfo } = req.body;
    
    // 记录操作者信息
    const eventData = await timeService.scheduleEvent(eventName, {
      ...timeInfo,
      operator: req.user.username,
      operatorRole: req.user.role
    });

    res.json({
      message: "事件已调度",
      event: eventData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/time/:event/pause
async function pauseEvent(req, res) {
  try {
    const eventName = req.params.event;
    
    // 记录操作者信息
    await timeService.pauseEvent(eventName, {
      operator: req.user.username,
      operatorRole: req.user.role
    });

    res.json({
      message: "事件已暂停",
      event: eventName
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/time/:event/resume
async function resumeEvent(req, res) {
  try {
    const eventName = req.params.event;
    
    // 记录操作者信息
    await timeService.resumeEvent(eventName, {
      operator: req.user.username,
      operatorRole: req.user.role
    });

    res.json({
      message: "事件已恢复",
      event: eventName
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/time/:event/edit body {durationSec}
async function editEvent(req, res) {
  try {
    const eventName = req.params.event;
    const { durationSec } = req.body;
    const event = await timeService.editEvent(eventName, durationSec);
    if (!event) {
      return res.status(404).json({ error: '事件未找到' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/time/fixed
async function getFixedTimeData(req, res) {
  try {
    const data = await timeService.getFixedTimeData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getCurrentTime,
  getEventState,
  scheduleEvent,
  pauseEvent,
  resumeEvent,
  editEvent,
  getFixedTimeData
};
