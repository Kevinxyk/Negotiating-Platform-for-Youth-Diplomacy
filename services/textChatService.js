// File: my-backend/services/textChatService.js
"use strict";

// 使用内存假数据模拟存储
const { messages } = require('../data/messages');

// 获取历史记录，返回最近 limit 条
async function getHistory(roomId, limit) {
  return messages
    .filter(msg => msg.roomId === roomId)
    .slice(-limit);
}

// 保存新消息
async function saveMessage(roomId, msg) {
  messages.push({ roomId, ...msg, timestamp: Date.now() });
}

module.exports = { getHistory, saveMessage };