"use strict";
const scoreService = require("../services/scoreService");

/**
 * POST /api/score/:room
 * 提交评分（需要 admin 或 host 角色）
 */
async function submitScore(req, res) {
  try {
    const room = req.params.room;
    const { targetUser, score, comment } = req.body;
    
    // 验证评分者身份
    const scoreData = await scoreService.submitScore(room, {
      targetUser,
      score,
      comment,
      judge: req.user.username,  // 使用认证用户作为评分者
      judgeRole: req.user.role   // 记录评分者角色
    });

    res.status(201).json({
      message: "评分已提交",
      score: scoreData
    });
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
    const room = req.params.room;
    const scores = await scoreService.getAggregatedScores(room);
    res.json(scores);
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
    const room = req.params.room;
    const user = req.params.user;
    
    // 检查权限：只能查看自己的评分历史，除非是管理员
    if (user !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ error: '没有权限查看此用户的评分历史' });
    }

    const history = await scoreService.getUserScoreHistory(room, user);
    res.json(history);
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
    const room = req.params.room;
    const ranking = await scoreService.getRanking(room);
    res.json(ranking);
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
    const room = req.params.room;
    const aiScores = await scoreService.computeAIScore(room);
    res.json({
      message: "AI评分已计算",
      scores: aiScores
    });
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