"use strict";
const scoreSvc = require("../services/scoreService");

/**
 * judge 提分
 */
async function submitScore(req, res) {
  try {
    const roomId      = req.params.room;
    const judgeId     = req.headers["x-user-role"];
    const { targetUserId, comments, score } = req.body;
    const entry = await scoreSvc.addScore(roomId, {
      judgeId,
      targetUserId,
      comments,
      score
    });
    // 按测试期望回传 judgeId / targetUserId / comments / score / timestamp / id
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/score/:room
 */
async function getAggregatedScores(req, res) {
  try {
    const roomId = req.params.room;
    const data   = await scoreSvc.getAggregatedScores(roomId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/score/:room/history/:user
 */
async function getUserScoreHistory(req, res) {
  try {
    const roomId = req.params.room;
    const user   = req.params.user;
    const data   = await scoreSvc.getUserScoreHistory(roomId, user);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/score/:room/ranking
 */
async function getRanking(req, res) {
  try {
    const roomId = req.params.room;
    const data   = await scoreSvc.getRanking(roomId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/score/:room/ai
 */
async function computeAIScore(req, res) {
  try {
    const roomId = req.params.room;
    const { avg } = await scoreSvc.computeAIScore(roomId);
    res.json({ roomId, aiScore: avg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  submitScore,
  getAggregatedScores,
  getUserScoreHistory,
  getRanking,
  computeAIScore
}; 