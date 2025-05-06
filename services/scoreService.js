"use strict";
const { v4: uuidv4 } = require("uuid");

// 存储结构：{ roomId: [ {judgeId, targetUserId, comments, score, timestamp, id}, … ] }
const scores = {};
const _clearedScoreRooms = new Set();

// 仅第一次清空
async function clearRoomScores(room) {
  if (!_clearedScoreRooms.has(room)) {
    scores[room] = [];
    _clearedScoreRooms.add(room);
  }
}

// 添加评分
async function addScore(room, { judgeId, targetUserId, comments, score }) {
  if (!scores[room]) scores[room] = [];
  const entry = {
    id:           uuidv4(),
    judgeId,
    targetUserId,
    comments,
    score,
    timestamp:    new Date().toISOString()
  };
  scores[room].push(entry);
  return entry;
}

// 聚合平均分
async function getAggregatedScores(room) {
  const list = scores[room] || [];
  const map  = {};
  list.forEach(e => {
    if (!map[e.targetUserId]) map[e.targetUserId] = { sum: 0, cnt: 0 };
    map[e.targetUserId].sum += e.score;
    map[e.targetUserId].cnt++;
  });
  return Object.keys(map).map(userId => ({
    targetUserId: userId,
    avgScore:     (map[userId].sum / map[userId].cnt).toString()
  }));
}

// 单用户历史
async function getUserScoreHistory(room, user) {
  return (scores[room] || []).filter(e => e.targetUserId === user);
}

// 排名
async function getRanking(room) {
  const aggs = await getAggregatedScores(room);
  return aggs.sort((a, b) => parseFloat(b.avgScore) - parseFloat(a.avgScore));
}

// AI 评分
async function computeAIScore(room) {
  const aggs = await getAggregatedScores(room);
  const sum  = aggs.reduce((s, e) => s + parseFloat(e.avgScore), 0);
  const avg  = aggs.length ? (sum / aggs.length).toString() : "0";
  return { avg };
}

module.exports = {
  addScore,
  getAggregatedScores,
  getUserScoreHistory,
  getRanking,
  computeAIScore,
  clearRoomScores
};