// File: my-backend/services/textChatService.js
"use strict";
const { v4: uuidv4 } = require('uuid');
const { messages } = require('../data/messages');

async function getHistory(roomId, limit = 50, offset = 0) {
  const active = messages.filter(m => m.roomId === roomId && m.status === 'active');
  // Return slice: from offset to offset+limit
  return active.slice(offset, offset + limit);
}

async function saveMessage(roomId, msg) {
  messages.push({
    id: msg.id || uuidv4(),
    roomId,
    ...msg,
    status: 'active',
    createdAt: new Date().toISOString()
  });
}

async function revokeMessage(roomId, messageId) {
  const msg = messages.find(m => m.id === messageId && m.roomId === roomId);
  if (!msg) throw new Error('Message not found');
  msg.status = 'revoked';
  msg.revokedAt = new Date().toISOString();
  return msg;
}

async function summarizeByUser(roomId) {
  const count = {};
  messages.forEach(m => {
    if (m.roomId === roomId && m.status === 'active') {
      count[m.username] = (count[m.username] || 0) + 1;
    }
  });
  return count;
}

async function summarizeByTime(roomId, interval = 'hour') {
  const buckets = {};
  messages.forEach(m => {
    if (m.roomId === roomId && m.status === 'active') {
      const date = new Date(m.createdAt);
      let key;
      if (interval === 'minute') {
        key = `${date.getHours()}:${date.getMinutes()}`;
      } else { // hour
        key = `${date.getHours()}:00`;
      }
      buckets[key] = (buckets[key] || 0) + 1;
    }
  });
  return buckets;
}

async function searchMessages(roomId, { keyword, username, from, to }) {
  return messages.filter(m => {
    if (m.roomId !== roomId || m.status !== 'active') return false;
    if (keyword && !m.text.includes(keyword)) return false;
    if (username && m.username !== username) return false;
    if (from && new Date(m.createdAt) < new Date(from)) return false;
    if (to && new Date(m.createdAt) > new Date(to)) return false;
    return true;
  });
}

module.exports = {
  getHistory,
  saveMessage,
  revokeMessage,
  summarizeByUser,
  summarizeByTime,
  searchMessages
};