// File: my-backend/controllers/participantController.js
"use strict";

const participantService = require('../services/participantService');

// 列出房间参会者
async function getParticipants(req, res) {
  try {
    const { roomId } = req.params;
    const participants = await participantService.getParticipants(roomId);
    res.json(participants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// 添加一个新参会者
async function addParticipant(req, res) {
  try {
    const { roomId } = req.params;
    const participant = req.body;
    
    const newParticipant = await participantService.addParticipant(roomId, participant);
    res.json(newParticipant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getParticipants,
  addParticipant
};
