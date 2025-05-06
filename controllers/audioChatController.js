// File: my-backend/controllers/audioChatController.js
"use strict";
const { saveRecording, controlAudio, listRecordings } = require('../services/audioChatService');

// Upload audio recording
async function uploadRecording(req, res) {
  const { roomId } = req.params;
  const file = req.file;
  const username = req.body.username;
  if (!file || !username) {
    return res.status(400).json({ error: 'file and username required' });
  }
  const rec = await saveRecording(roomId, file, username);
  res.status(201).json(rec);
}

// Control audio: mute/unmute/hangup/resume
async function controlAudioHandler(req, res) {
  const { roomId } = req.params;
  const { username, action } = req.body;
  if (!username || !action) {
    return res.status(400).json({ error: 'username and action required' });
  }
  const state = await controlAudio(roomId, username, action);
  res.json(state);
}

// List recordings
async function listAudioHandler(req, res) {
  const { roomId } = req.params;
  const recs = await listRecordings(roomId);
  res.json(recs);
}

module.exports = { uploadRecording, controlAudioHandler, listAudioHandler };