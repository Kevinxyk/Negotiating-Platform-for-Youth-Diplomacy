// File: my-backend/controllers/scoringController.js
"use strict";
const scoringService = require('../services/scoringService');

// POST /api/score/:roomId
async function submitScore(req, res) {
  try {
    const { roomId } = req.params;
    const { judgeId, role, targetUserId, dimensionScores, comments } = req.body;
    
    const score = await scoringService.submitScore(
      roomId,
      judgeId,
      role,
      targetUserId,
      dimensionScores,
      comments
    );
    res.json(score);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/score/:roomId
async function getScores(req, res) {
  try {
    const { roomId } = req.params;
    const scores = await scoringService.getScores(roomId);
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/score/:roomId/history/:userId
async function getScoreHistory(req, res) {
  try {
    const { roomId, userId } = req.params;
    const history = await scoringService.getScoreHistory(roomId, userId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/score/:roomId/ranking
async function getRanking(req, res) {
  try {
    const { roomId } = req.params;
    const ranking = await scoringService.getRanking(roomId);
    res.json(ranking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/score/:roomId/ai
async function computeAIHandler(req, res) {
  const { roomId } = req.params;
  const aiResult = await scoringService.computeAIScore(roomId);
  res.json(aiResult);
}

module.exports = {
  submitScore,
  getScores,
  getScoreHistory,
  getRanking,
  computeAIHandler
};
