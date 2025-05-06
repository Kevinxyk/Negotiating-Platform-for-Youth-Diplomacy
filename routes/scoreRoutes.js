const express = require('express');
const router = express.Router();
const ScoreService = require('../services/scoreService');

// Middleware to check role
const checkRole = (role) => (req, res, next) => {
  const userRole = req.headers['x-user-role'];
  if (!userRole || userRole !== role) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
};

// Submit score
router.post('/:room', checkRole('judge'), async (req, res) => {
  try {
    const score = await ScoreService.addScore(req.params.room, req.body);
    res.status(201).json(score);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all scores for a room
router.get('/:room', async (req, res) => {
  try {
    const scores = await ScoreService.getScores(req.params.room);
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user score history
router.get('/:room/history/:user', async (req, res) => {
  try {
    const scores = await ScoreService.getUserScoreHistory(req.params.room, req.params.user);
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ranking
router.get('/:room/ranking', async (req, res) => {
  try {
    const ranking = await ScoreService.getRanking(req.params.room);
    res.json(ranking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI score computation
router.post('/:room/ai', checkRole('sys'), async (req, res) => {
  try {
    const aiScore = await ScoreService.computeAIScore(req.params.room);
    res.json(aiScore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 