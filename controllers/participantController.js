// File: my-backend/controllers/participantController.js
"use strict";

const { getParticipants, addParticipant } = require('../services/participantService');

// 列出房间参会者
async function listParticipants(req, res) {
  const roomId = req.params.roomId;
  const list = await getParticipants(roomId);
  res.json(list);
}

// 添加一个新参会者
async function addNewParticipant(req, res) {
  const roomId = req.params.roomId;
  const { userId, username, country, role, avatarUrl } = req.body;
  if (!userId || !username || !country || !role) {
    return res.status(400).json({ error: '缺少必要的参会者字段' });
  }
  await addParticipant(roomId, { userId, username, country, role, avatarUrl: avatarUrl || null });
  res.status(201).json({ status: 'ok' });
}

module.exports = { listParticipants, addNewParticipant };
