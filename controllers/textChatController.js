// File: my-backend/controllers/textChatController.js
"use strict";

const { getHistory, saveMessage } = require('../services/textChatService');

// 获取聊天历史
async function getChatHistory(req, res) {
  const roomId = req.params.roomId;
  const limit = parseInt(req.query.limit) || 50;
  const history = await getHistory(roomId, limit);
  res.json(history);
}

// 发送新消息
async function sendChatMessage(req, res) {
  const roomId = req.params.roomId;
  const { username, country, role, text } = req.body;
  if (!username || !text) {
    return res.status(400).json({ error: '用户名和消息内容不能为空' });
  }
  await saveMessage(roomId, { username, country, role, text });
  res.status(201).json({ status: 'ok' });
}

module.exports = { getChatHistory, sendChatMessage };