// File: my-backend/services/audioChatService.js
"use strict";
const { recordings, userAudioStates, uuidv4 } = require('../data/audioData');

/** Save uploaded audio file metadata */
async function saveRecording(roomId, file, userId, username) {
  const rec = {
    id: uuidv4(),
    roomId,
    userId,
    username,
    filename: file.filename,
    path: file.path,
    timestamp: new Date().toISOString()
  };
  recordings.push(rec);
  return rec;
}

/** Control audio state for a user */
async function controlAudio(roomId, userId, action) {
  if (!userAudioStates[roomId]) {
    userAudioStates[roomId] = {};
  }
  if (!userAudioStates[roomId][userId]) {
    userAudioStates[roomId][userId] = {
      muted: false,
      microphoneOn: true,
      hangup: false
    };
  }

  const state = userAudioStates[roomId][userId];
  switch (action) {
    case 'mute':
      state.muted = true;
      break;
    case 'unmute':
      state.muted = false;
      break;
    case 'hangup':
      state.hangup = true;
      break;
    case 'resume':
      state.hangup = false;
      break;
  }
  return state;
}

/** List all recordings for a room */
async function listRecordings(roomId) {
  return recordings.filter(r => r.roomId === roomId);
}

module.exports = {
  saveRecording,
  controlAudio,
  listRecordings
};