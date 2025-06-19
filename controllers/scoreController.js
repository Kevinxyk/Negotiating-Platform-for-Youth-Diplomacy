"use strict";
const scoreSvc = require("../services/scoreService");

/**
 * POST /api/score/:room
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
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/score/:room
 * 获取汇总分数（所有登录用户可查看）
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
 * 获取用户评分历史（所有登录用户可查看）
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
 * 获取排名（所有登录用户可查看）
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
 * AI评分计算（仅管理员可用）
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