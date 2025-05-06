// File: my-backend/services/scoringService.js
"use strict";
const { scores, uuidv4 } = require('../data/scores');
const { dimensions, roleWeights } = require('../data/scoreConfig');

/**
 * Submit or update a judge's multi-dimensional score for a target user
 */
async function submitScore(roomId, judgeId, role, targetUserId, dimensionScores, comments) {
  let rec = scores.find(r => r.roomId === roomId && r.judgeId === judgeId && r.targetUserId === targetUserId);
  const now = new Date().toISOString();
  if (rec) {
    rec.dimensionScores = dimensionScores;
    rec.comments = comments;
    rec.timestamp = now;
    rec.role = role;
  } else {
    rec = {
      id: uuidv4(),
      roomId,
      judgeId,
      role,
      targetUserId,
      dimensionScores,
      comments,
      timestamp: now
    };
    scores.push(rec);
  }
  return rec;
}

/**
 * Aggregate scores by target user using dimension and role weights
 */
async function getScores(roomId) {
  const agg = {};
  scores.filter(r => r.roomId === roomId).forEach(r => {
    const rw = roleWeights[r.role] || 1;
    // compute weighted sum for this record
    let total = 0;
    dimensions.forEach(d => {
      const v = r.dimensionScores[d.id] || 0;
      total += v * d.weight;
    });
    total *= rw;
    if (!agg[r.targetUserId]) agg[r.targetUserId] = { sum: 0, weightSum: 0 };
    agg[r.targetUserId].sum += total;
    agg[r.targetUserId].weightSum += rw;
  });
  return Object.entries(agg).map(([userId, { sum, weightSum }]) => ({
    targetUserId: userId,
    avgScore: weightSum ? (sum / weightSum).toFixed(2) : 0,
    judgeCount: scores.filter(r => r.roomId === roomId && r.targetUserId === userId).length
  }));
}

async function getScoreHistory(roomId, targetUserId) {
  return scores.filter(r => r.roomId === roomId && r.targetUserId === targetUserId);
}

async function getRanking(roomId) {
  const list = await getScores(roomId);
  return list.sort((a, b) => b.avgScore - a.avgScore);
}

async function computeAIScore(roomId) {
  // default placeholder, sum average across dimensions
  const list = await getScores(roomId);
  const avg = list.reduce((acc, u) => acc + parseFloat(u.avgScore), 0) / (list.length || 1);
  return { roomId, aiScore: avg.toFixed(2), remarks: 'AI default summary' };
}

module.exports = { submitScore, getScores, getScoreHistory, getRanking, computeAIScore };