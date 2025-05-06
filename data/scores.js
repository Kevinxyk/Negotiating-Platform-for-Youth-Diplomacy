// File: my-backend/data/scores.js
"use strict";
const { v4: uuidv4 } = require('uuid');

/**
 * Score record stores multi-dimensional scores
 * { id, roomId, judgeId, targetUserId, dimensionScores: {dimId: number}, comments, timestamp, role }
 */
let scores = [];

module.exports = { scores, uuidv4 };