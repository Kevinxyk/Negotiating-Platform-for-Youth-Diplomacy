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
  const list = await getScores(roomId);

  if (list.length === 0) {
    return { roomId, aiScore: '0.00', remarks: 'AI default summary' };
  }

  const dimWeights = dimensions.reduce((m, d) => {
    m[d.id] = d.weight;
    return m;
  }, {});

  let sum = 0;
  let weightSum = 0;

  for (const record of list) {
    let score = 0;
    for (const [dim, val] of Object.entries(record.dimensionScores)) {
      const w = dimWeights[dim] || 0;
      score += val * w;
    }

    const roleFactor = roleWeights[record.role] || 1;
    sum += score * roleFactor;
    weightSum += roleFactor;
  }

  const avg = sum / weightSum;
  return { roomId, aiScore: avg.toFixed(2), remarks: 'AI default summary' };
}

module.exports = { submitScore, getScores, getScoreHistory, getRanking, computeAIScore };