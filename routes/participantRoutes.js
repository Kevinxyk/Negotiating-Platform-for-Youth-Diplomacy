// File: my-backend/routes/participantRoutes.js
"use strict";

const express = require('express');
const router = express.Router();
const { listParticipants, addNewParticipant } = require('../controllers/participantController');

// GET  /api/participants/:roomId       → 列出该房间所有参会者
router.get('/:roomId', listParticipants);

// POST /api/participants/:roomId/add   → 添加参会者，Body: {userId,username,country,role,avatarUrl?}
router.post('/:roomId/add', addNewParticipant);

module.exports = router;
