// File: my-backend/data/audioData.js
"use strict";
const { v4: uuidv4 } = require('uuid');

// In-memory storage for audio recordings and user audio states
// recordings: each { id, roomId, userId, username, filename, path, url?, timestamp }
// userAudioStates: { [roomId]: { [userId]: { muted: boolean, microphoneOn: boolean, hangup: boolean } } }
// 注意：所有链路只认 userId，username 仅用于展示，如需互查请用 userService 的 getUsernameById/getUserIdByUsername

const recordings = []; // each: { id, roomId, userId, username, filename, path, url?, timestamp }
const userAudioStates = {}; // { [roomId]: { [userId]: { muted: boolean, microphoneOn: boolean, hangup: boolean } } }

module.exports = { recordings, userAudioStates, uuidv4 };
