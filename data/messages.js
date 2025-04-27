// File: my-backend/data/messages.js
"use strict";

// 内存数组，初始化一条欢迎消息
let messages = [
  { roomId: 'default', username: '系统', country: '系统', role: 'system', text: '欢迎进入聊天室！', timestamp: Date.now() }
];

module.exports = { messages };
