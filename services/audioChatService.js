// File: my-backend/services/audioChatService.js
"use strict";
const { recordings, userAudioStates, uuidv4 } = require('../data/audioData');

/** Save uploaded audio file metadata */
async function saveRecording(roomId, file, username) {
  const rec = {
    id: uuidv4(),
    roomId,
    username,
    filename: file.filename,
    path: file.path,
    timestamp: new Date().toISOString()
  };
  recordings.push(rec);
  return rec;
}

/** Control audio state for a user */
async function controlAudio(roomId, username, action) {
  if (!userAudioStates[roomId]) {
    userAudioStates[roomId] = {};
  }
  if (!userAudioStates[roomId][username]) {
    userAudioStates[roomId][username] = {
      muted: false,
      microphoneOn: true,
      hangup: false
    };
  }

  const state = userAudioStates[roomId][username];
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