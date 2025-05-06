// File: my-backend/routes/audioChatRoutes.js
"use strict";
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  uploadRecording,
  controlAudioHandler,
  listAudioHandler
} = require('../controllers/audioChatController');
const { requireRoles } = require('../middleware/roleMiddleware');

// Upload audio (multipart/form-data, field 'file')
router.post('/:roomId/upload', requireRoles(['delegate','sys','admin','host']), upload.single('file'), uploadRecording);
// Control audio state
router.post('/:roomId/control', requireRoles(['delegate','sys','admin','host']), controlAudioHandler);
// List audio recordings
router.get('/:roomId/recordings', listAudioHandler);

module.exports = router;
