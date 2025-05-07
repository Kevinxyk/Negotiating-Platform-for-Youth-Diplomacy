// File: my-backend/data/messages.js
"use strict";
const { v4: uuidv4 } = require('uuid');

// In-memory message store
// Each message: { id, roomId, username, country, role, text, status, createdAt, revokedAt? }


module.exports.messages = [
  {
    id: uuidv4(),               // 唯一 ID
    room: "room1",  // 添加 room 字段
    username: "system",
    text: "欢迎进入聊天室",
    timestamp: new Date().toISOString(),
    revoked: false
  }
];