// File: my-backend/routes/textChatRoutes.js
"use strict";
const express = require('express');
const router = express.Router();
const {
  getChatHistory,
  sendChatMessage,
  revokeChatMessage,
  getSummaryByUser,
  getSummaryByTime,
  searchChatMessages
} = require('../controllers/textChatController');
const { requireRoles } = require('../middleware/roleMiddleware');

// History with pagination
router.get('/:roomId/messages', getChatHistory);
// Send message
router.post('/:roomId/send', sendChatMessage);
// Revoke message (author or admin)
router.post('/:roomId/message/:messageId/revoke', 
  requireRoles(['sys', 'admin', 'host']),
  revokeChatMessage
);
// User summary
router.get('/:roomId/summary/user', getSummaryByUser);
// Time summary (interval=hour|minute)
router.get('/:roomId/summary/time', getSummaryByTime);
// Search messages
router.get('/:roomId/search', searchChatMessages);

module.exports = router;
