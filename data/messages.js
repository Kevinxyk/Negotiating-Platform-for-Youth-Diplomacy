// File: my-backend/data/messages.js
"use strict";
const { v4: uuidv4 } = require('uuid');

// In-memory message store
// Each message: { id, roomId, username, country, role, text, status, createdAt, revokedAt? }
let messages = [
  {
    id: uuidv4(),
    roomId: 'default',
    username: '系统',
    country: '系统',
    role: 'system',
    text: '欢迎进入聊天室！',
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

module.exports = { messages };