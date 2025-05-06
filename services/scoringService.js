// File: my-backend/services/scoringService.js
"use strict";
const { scores, uuidv4 } = require('../data/scores');
const { dimensions, roleWeights } = require('../data/scoreConfig');

/**
 * Submit or update a judge's multi-dimensional score for a target user
 */
async function submitScore(roomId, judgeId, role, targetUserId, dimensionScores, comments) {
  const score = {
    id: uuidv4(),
    roomId,
    judgeId,
    targetUserId,
    dimensionScores,
    comments,
    timestamp: new Date().toISOString(),
    role
  };
  scores.push(score);
  return score;
}

/**
 * Aggregate scores by target user using dimension and role weights
 */
async function getScores(roomId) {
  return scores.filter(s => s.roomId === roomId);
}

async function getScoreHistory(roomId, userId) {
  return scores
    .filter(s => s.roomId === roomId && s.targetUserId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

async function getRanking(roomId) {
  const userScores = {};
  scores
    .filter(s => s.roomId === roomId)
    .forEach(s => {
      if (!userScores[s.targetUserId]) {
        userScores[s.targetUserId] = {
          total: 0,
          count: 0,
          dimensions: {}
        };
      }
      
      Object.entries(s.dimensionScores).forEach(([dim, score]) => {
        if (!userScores[s.targetUserId].dimensions[dim]) {
          userScores[s.targetUserId].dimensions[dim] = 0;
        }
        userScores[s.targetUserId].dimensions[dim] += score;
      });
      
      userScores[s.targetUserId].total += Object.values(s.dimensionScores).reduce((a, b) => a + b, 0);
      userScores[s.targetUserId].count++;
    });

  return Object.entries(userScores).map(([userId, data]) => ({
    userId,
    averageScore: data.total / data.count,
    dimensionAverages: Object.fromEntries(
      Object.entries(data.dimensions).map(([dim, total]) => [dim, total / data.count])
    )
  })).sort((a, b) => b.averageScore - a.averageScore);
}

async function computeAIScore(roomId) {
  // default placeholder, sum average across dimensions
  const list = await getScores(roomId);
  const avg = list.reduce((acc, u) => acc + parseFloat(u.avgScore), 0) / (list.length || 1);
  return { roomId, aiScore: avg.toFixed(2), remarks: 'AI default summary' };
}

module.exports = { submitScore, getScores, getScoreHistory, getRanking, computeAIScore };