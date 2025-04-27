// File: my-backend/data/participants.js
"use strict";

// 内存存储各房间的参会者列表
// 默认房间 default 包含一个系统提示
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
