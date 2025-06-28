// File: my-backend/data/scores.js
"use strict";
const { v4: uuidv4 } = require('uuid');

/**
 * Score record stores multi-dimensional scores
 * { id, roomId, judgeId, targetUserId, dimensionScores: {dimId: number}, comments, timestamp, role }
 * 注意：judgeId、targetUserId 均为 userId，所有链路只认 userId，展示时如需 username 统一通过 userService 的 getUsernameById 获取
 */
let scores = [];

module.exports = { scores, uuidv4 };