// File: my-backend/data/messages.js
"use strict";
const { v4: uuidv4 } = require('uuid');

// In-memory message store
// Each message: { id, roomId, userId, username, country, role, text, status, createdAt, revokedAt? }
// 注意：所有链路只认 userId，username 仅用于展示，如需互查请用 userService 的 getUsernameById/getUserIdByUsername


module.exports.messages = [
  {
    id: uuidv4(),               // 唯一 ID
    room: "room1",  // 添加 room 字段
    userId: uuidv4(),           // 用户唯一标识
    username: "system",        // 仅展示用
    text: "欢迎进入聊天室",
    timestamp: new Date().toISOString(),
    revoked: false
  }
];