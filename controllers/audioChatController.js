// File: my-backend/controllers/audioChatController.js
"use strict";
const audioChatService = require('../services/audioChatService');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Upload audio recording
async function saveRecording(req, res) {
  try {
    const { roomId } = req.params;
    const { username } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const recording = await audioChatService.saveRecording(roomId, file, username);
    res.json(recording);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Control audio: mute/unmute/hangup/resume
async function controlAudio(req, res) {
  try {
    const { roomId, username } = req.params;
    const { action } = req.body;
    
    const state = await audioChatService.controlAudio(roomId, username, action);
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// List recordings
async function listRecordings(req, res) {
  try {
    const { roomId } = req.params;
    const recordings = await audioChatService.listRecordings(roomId);
    res.json(recordings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  saveRecording: [upload.single('audio'), saveRecording],
  controlAudio,
  listRecordings
};