// File: my-backend/controllers/scoringController.js
"use strict";
const svc = require('../services/scoringService');

// POST /api/score/:roomId
async function submitScoreHandler(req, res) {
  const { roomId } = req.params;
  const { judgeId, role, targetUserId, dimensionScores, comments } = req.body;
  if (!judgeId || !role || !targetUserId || !dimensionScores) {
    return res.status(400).json({ error: 'judgeId, role, targetUserId, dimensionScores required' });
  }
  const rec = await svc.submitScore(roomId, judgeId, role, targetUserId, dimensionScores, comments || '');
  res.status(201).json(rec);
}

// GET /api/score/:roomId
async function getScoresHandler(req, res) {
  const { roomId } = req.params;
  const list = await svc.getScores(roomId);
  res.json(list);
}

// GET /api/score/:roomId/history/:userId
async function getScoreHistoryHandler(req, res) {
  const { roomId, userId } = req.params;
  const history = await svc.getScoreHistory(roomId, userId);
  res.json(history);
}

// GET /api/score/:roomId/ranking
async function getRankingHandler(req, res) {
  const { roomId } = req.params;
  const ranking = await svc.getRanking(roomId);
  res.json(ranking);
}

// POST /api/score/:roomId/ai
async function computeAIHandler(req, res) {
  const { roomId } = req.params;
  const aiResult = await svc.computeAIScore(roomId);
  res.json(aiResult);
}

module.exports = { submitScoreHandler, getScoresHandler, getScoreHistoryHandler, getRankingHandler, computeAIHandler };
