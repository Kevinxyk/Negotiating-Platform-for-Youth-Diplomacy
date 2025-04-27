// File: my-backend/services/participantService.js
"use strict";

const { participants } = require('../data/participants');

// 获取某房间所有参会者
async function getParticipants(roomId) {
  return participants[roomId] || [];
}

// 向某房间添加参会者
async function addParticipant(roomId, participant) {
  if (!participants[roomId]) participants[roomId] = [];
  participants[roomId].push(participant);
}

module.exports = { getParticipants, addParticipant };
