"use strict";
const { v4: uuidv4 } = require("uuid");
const { messages: defaults } = require("../data/messages");

// 全局消息存储
const messages = [];
module.exports.messages = messages;

// 记录哪些 room 已经清空过
const _clearedRooms = new Set();
async function clearRoomMessages(room) {
  if (!_clearedRooms.has(room)) {
    // 只在第一次调用时，移除所有该 room 的历史消息
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].room === room) messages.splice(i, 1);
    }
    _clearedRooms.add(room);
  }
}

// 获取／种子系统消息
async function getHistory(room, limit = 50, offset = 0) {
  let roomMsgs = messages.filter(m => m.room === room);
  if (roomMsgs.length === 0) {
    defaults.forEach(dm => {
      messages.push({
        id:        dm.id || uuidv4(),
        room,
        username:  dm.username,
        text:      dm.text,
        timestamp: dm.timestamp,
        revoked:   false
      });
    });
    roomMsgs = messages.filter(m => m.room === room);
  }
  return roomMsgs.slice(offset, offset + limit);
}

// 保存消息
async function saveMessage(room, { username, country, role, text }) {
  const entry = {
    id:        uuidv4(),
    room,
    username,
    country,
    role,
    text,
    timestamp: new Date().toISOString(),
    revoked:   false
  };
  messages.push(entry);
  return entry;
}

// 撤回
async function revokeMessage(id) {
  const msg = messages.find(m => m.id === id);
  if (!msg) return false;
  msg.revoked = true;
  return true;
}

// 添加：根据消息 ID 获取消息
async function getMessageById(id) {
  return messages.find(m => m.id === id);
}

// 按用户汇总：不仅返回数量，也返回消息列表
async function getUserSummary(room) {
  const roomMsgs = messages.filter(m => m.room === room && !m.revoked);
  const byUser = {};
  roomMsgs.forEach(m => {
    if (!byUser[m.username]) {
      byUser[m.username] = { count: 0, messages: [] };
    }
    byUser[m.username].count++;
    byUser[m.username].messages.push(m);
  });
  return byUser;
}

// 按小时汇总
async function getTimeSummary(room) {
  const roomMsgs = messages.filter(m => m.room === room && !m.revoked);
  const byHour = {};
  roomMsgs.forEach(m => {
    const h = new Date(m.timestamp).getHours();
    if (!byHour[h]) {
      byHour[h] = { count: 0, messages: [] };
    }
    byHour[h].count++;
    byHour[h].messages.push(m);
  });
  return byHour;
}

// 搜索
async function searchMessages(room, keyword) {
  return messages.filter(
    m => m.room === room && !m.revoked && m.text.includes(keyword)
  );
}

module.exports = {
  messages,
  getHistory,
  saveMessage,
  revokeMessage,
  getMessageById,
  clearRoomMessages,
  getUserSummary,
  getTimeSummary,
  searchMessages
};