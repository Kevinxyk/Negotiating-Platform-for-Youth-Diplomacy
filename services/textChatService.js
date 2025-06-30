"use strict";
const { v4: uuidv4 } = require("uuid");
const { messages: defaults } = require("../data/messages");
const store = require('../data/store');
const persistence = require('../data/persistence');


// 直接使用 store.messages，避免引用失效
function getMessagesArray() {
  return store.messages;
}

const _clearedRooms = new Set();
async function clearRoomMessages(room) {
  if (_clearedRooms.has(room)) return;
  const arr = getMessagesArray();
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].room === room) arr.splice(i, 1);
  }
  const persisted = store.getMessages(room);
  if (persisted.length > 0) {
    persistence.rooms.setRoomData(room, 'messages', []);
  }
  _clearedRooms.add(room);
}

// 获取／种子系统消息
async function getHistory(room, limit = 50, offset = 0) {
  const arr = getMessagesArray();
  let roomMsgs = arr.filter(m => m.room === room);
  if (roomMsgs.length === 0) {
    defaults.forEach(dm => {
      arr.push({
        id:        dm.id || uuidv4(),
        room,
        username:  dm.username,
        userId:    dm.userId || null, // 补全 userId
        text:      dm.text,
        timestamp: dm.timestamp,
        revoked:   false
      });
    });
    roomMsgs = arr.filter(m => m.room === room);
  }
  return roomMsgs.slice(offset, offset + limit);
}

// 保存消息
async function saveMessage(room, { username, country, role, text, userId, quoteId }) {
  const entry = {
    id:        uuidv4(),
    room,
    username: sanitizeString(username),
    userId: userId || null, // 用户ID
    country: country || '',
    role: role || 'user',
    text: sanitizeString(text),
    timestamp: new Date().toISOString(),
    revoked:   false,
    quote: null
  };

  if (quoteId) {
    const target = getMessagesArray().find(m => m.id === quoteId);
    if (target) {
      entry.quote = {
        id: target.id,
        username: target.username,
        text: target.text
      };
    }
  }
  
  store.addMessage(entry);
  return entry;
}

// 撤回
async function revokeMessage(id) {
  const msg = getMessagesArray().find(m => m.id === id);
  if (!msg) return false;
  msg.revoked = true;
  return true;
}

// 添加：根据消息 ID 获取消息
async function getMessageById(id) {
  return getMessagesArray().find(m => m.id === id);
}

// 按用户汇总：不仅返回数量，也返回消息列表
async function getUserSummary(room) {
  const roomMsgs = getMessagesArray().filter(m => m.room === room && !m.revoked);
  const byUser = {};
  roomMsgs.forEach(m => {
    if (!byUser[m.userId]) {
      byUser[m.userId] = { count: 0, messages: [], username: m.username };
    }
    byUser[m.userId].count++;
    byUser[m.userId].messages.push(m);
  });
  return byUser;
}

// 按小时汇总
async function getTimeSummary(room) {
  const roomMsgs = getMessagesArray().filter(m => m.room === room && !m.revoked);
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
  return getMessagesArray().filter(
    m => m.room === room && !m.revoked && m.text.includes(keyword)
  );
}

module.exports = {
  get messages() { return store.messages; },
  getHistory,
  saveMessage,
  revokeMessage,
  getMessageById,
  clearRoomMessages,
  getUserSummary,
  getTimeSummary,
  searchMessages,
  exportHistory
};

// 导出历史记录
function exportHistory(room) {
  return getMessagesArray().filter(m => m.room === room);
}
