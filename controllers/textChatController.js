// File: my-backend/controllers/textChatController.js
"use strict";
const {
  getHistory,
  saveMessage,
  revokeMessage,
  summarizeByUser,
  summarizeByTime,
  searchMessages
} = require('../services/textChatService');
const eventBus = require('../services/eventBus');

async function getChatHistory(req, res) {
  const { roomId } = req.params;
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const history = await getHistory(roomId, limit, offset);
  res.json(history);
}

async function sendChatMessage(req, res) {
  const { roomId } = req.params;
  const { username, country, role, text } = req.body;
  if (!username || !text) return res.status(400).json({ error: '用户名和内容不能为空' });
  const msg = { username, country, role, text };
  await saveMessage(roomId, msg);
  eventBus.emit('chatMessage', { roomId, msg });
  res.status(201).json({ status: 'ok' });
}

async function revokeChatMessage(req, res) {
  const { roomId, messageId } = req.params;
  try {
    const msg = await revokeMessage(roomId, messageId);
    eventBus.emit('messageRevoked', { roomId, messageId });
    res.json(msg);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
}

async function getSummaryByUser(req, res) {
  const { roomId } = req.params;
  const summary = await summarizeByUser(roomId);
  res.json(summary);
}

async function getSummaryByTime(req, res) {
  const { roomId } = req.params;
  const interval = req.query.interval || 'hour';
  const summary = await summarizeByTime(roomId, interval);
  res.json(summary);
}

async function searchChatMessages(req, res) {
  const { roomId } = req.params;
  const filters = {
    keyword: req.query.keyword,
    username: req.query.username,
    from: req.query.from,
    to: req.query.to
  };
  const results = await searchMessages(roomId, filters);
  res.json(results);
}

module.exports = {
  getChatHistory,
  sendChatMessage,
  revokeChatMessage,
  getSummaryByUser,
  getSummaryByTime,
  searchChatMessages
};