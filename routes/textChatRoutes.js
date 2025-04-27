"use strict";

const express = require('express');
const router = express.Router();
const { getChatHistory, sendChatMessage } = require('../controllers/textChatController');

// 获取指定房间的聊天历史，路径 /api/chat/:roomId/history
router.get('/:roomId/history', getChatHistory);

// 向指定房间发送新消息，路径 /api/chat/:roomId/send
router.post('/:roomId/send', sendChatMessage);

module.exports = router;
