// File: my-backend/data/participants.js
"use strict";

// 内存存储各房间的参会者列表
// 注意：所有链路只认 userId，username 仅用于展示，userId/username 互查统一用 userService 的 getUsernameById/getUserIdByUsername
let participants = {
  default: [
    {
      userId: 'system',
      username: '系统',
      country: '系统',
      role: 'system',
      avatarUrl: null
    }
  ]
};

module.exports = { participants };
