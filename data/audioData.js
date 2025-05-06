// File: my-backend/data/audioData.js
"use strict";
const { v4: uuidv4 } = require('uuid');

// In-memory storage for audio recordings and user audio states
const recordings = []; // each: { id, roomId, username, filename, path, url?, timestamp }
const userAudioStates = {}; // { [roomId]: { [username]: { muted: boolean, microphoneOn: boolean, hangup: boolean } } }

module.exports = { recordings, userAudioStates, uuidv4 };
