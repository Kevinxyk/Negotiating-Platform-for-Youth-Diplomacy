"use strict";
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// 导入数据持久化模块
const persistence = require('./persistence');

// 读取持久化用户
const persistedUsers = persistence.users.getAll();

const DEFAULT_USERS = [
  {
    userId: 'b1e1e1e1-1111-1111-1111-111111111111',
    username: 'admin',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'admin'
  },
  {
    userId: 'b2e2e2e2-2222-2222-2222-222222222222',
    username: 'host',
    passwordHash: bcrypt.hashSync('host123', 10),
    role: 'host'
  },
  {
    userId: 'b3e3e3e3-3333-3333-3333-333333333333',
    username: 'sys',
    passwordHash: bcrypt.hashSync('sys123', 10),
    role: 'sys'
  },
  {
    userId: 'b4e4e4e4-4444-4444-4444-444444444444',
    username: 'student',
    passwordHash: bcrypt.hashSync('student123', 10),
    role: 'student'
  },
  {
    userId: 'b5e5e5e5-5555-5555-5555-555555555555',
    username: 'observer',
    passwordHash: bcrypt.hashSync('observer123', 10),
    role: 'observer'
  },
  {
    userId: 'b6e6e6e6-6666-6666-6666-666666666666',
    username: 'judge',
    passwordHash: bcrypt.hashSync('judge123', 10),
    role: 'judge'
  },
  {
    userId: 'b7e7e7e7-7777-7777-7777-777777777777',
    username: 'delegate',
    passwordHash: bcrypt.hashSync('delegate123', 10),
    role: 'delegate'
  }
];

// 内存存储
const store = {
  // 用户存储
  users: persistedUsers.length > 0 ? persistedUsers : DEFAULT_USERS,

  // 房间存储
  rooms: [],

  // 消息存储（已有）
  messages: [],

  // 评分存储（已有）
  scores: [],

  // 时间事件存储（已有）
  timeEvents: {},

  // 录音存储
  recordings: [],

  // 图片存储
  images: [],

  // 语音消息存储
  voiceMessages: [],

  // 消息日志存储
  messageLogs: [],

  // 系统日志存储
  systemLogs: [],

  // 表情统计存储
  emojiStats: {}
};

// 若持久化数据为空，初始化默认用户到持久化层
if (persistedUsers.length === 0) {
  DEFAULT_USERS.forEach(u => persistence.users.add(u));
}

// 用户相关方法
store.findUserByUsername = (username) => {
  return store.users.find(u => u.username === username);
};

store.findUserById = (userId) => {
  return store.users.find(u => u.userId === userId);
};

store.addUser = (user) => {
  const newUser = {
    userId: uuidv4(),
    ...user
  };
  store.users.push(newUser);
  return newUser;
};

// 房间相关方法
store.findRoomById = (roomId) => {
  return persistence.rooms.getById(roomId);
};

store.findRoomByInviteCode = (inviteCode) => {
  return store.rooms.find(r => r.inviteCode === inviteCode);
};

// 根据用户ID获取其参与的所有房间
store.getRoomsByUser = (userId) => {
  // 获取所有房间，并确保participants字段格式正确
  const allRooms = persistence.rooms.getAll();
  console.log('从persistence获取的房间:', allRooms);
  
  return allRooms.filter(room => {
    // 确保participants字段存在且格式正确
    if (!room.participants) {
      room.participants = [];
    }
    // 如果participants是简单数组，转换为对象数组
    if (Array.isArray(room.participants) && room.participants.length > 0 && typeof room.participants[0] === 'string') {
      room.participants = room.participants.map(userId => ({
        userId: userId,
        role: 'observer',
        joinedAt: new Date().toISOString()
      }));
    }
    
    // 检查用户是否在参与者列表中
    return room.participants.some(p => p.userId === userId);
  }).map(room => {
    // 确保所有必要字段都存在
    return {
      id: room.id,
      name: room.name || `房间 ${room.id}`,
      description: room.description || '',
      maxParticipants: room.maxParticipants || 10,
      isPrivate: room.isPrivate || false,
      createdBy: room.createdBy || '',
      participants: room.participants || [],
      schedule: room.schedule || [],
      settings: room.settings || {},
      createdAt: room.createdAt || new Date().toISOString(),
      updatedAt: room.updatedAt || room.createdAt || new Date().toISOString()
    };
  });
};

store.addRoom = (room) => {
  const newRoom = persistence.rooms.add(room);
  return newRoom;
};

store.updateRoom = (room) => {
  return persistence.rooms.update(room.id, room);
};

store.removeRoom = (roomId) => {
  return persistence.rooms.remove(roomId);
};

// 消息相关方法（隔离存储）
store.getMessages = (roomId, limit = 50, offset = 0) => {
  const msgs = persistence.rooms.getRoomData(roomId, 'messages');
  return msgs.slice(offset, offset + limit);
};

store.addMessage = function(message) {
  // 自动补充text字段，兼容textChat统计
  if (!message.text && message.content) {
    message.text = message.content;
  }
  // 生成唯一ID（如无）
  if (!message.id) {
    message.id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  const msgs = persistence.rooms.getRoomData(message.room, 'messages');
  msgs.push(message);
  persistence.rooms.setRoomData(message.room, 'messages', msgs);
  // 同步到内存存储，便于即时查询
  store.messages.push(message);
  return message;
};

store.findMessageById = (messageId, roomId) => {
  const msgs = persistence.rooms.getRoomData(roomId, 'messages');
  return msgs.find(m => m.id === messageId);
};

store.updateMessage = (message) => {
  const msgs = persistence.rooms.getRoomData(message.room, 'messages');
  const idx = msgs.findIndex(m => m.id === message.id);
  if (idx !== -1) {
    msgs[idx] = { ...msgs[idx], ...message };
    persistence.rooms.setRoomData(message.room, 'messages', msgs);
    return msgs[idx];
  }
  return null;
};

store.removeMessage = (messageId, roomId) => {
  let msgs = persistence.rooms.getRoomData(roomId, 'messages');
  const idx = msgs.findIndex(m => m.id === messageId);
  if (idx !== -1) {
    msgs.splice(idx, 1);
    persistence.rooms.setRoomData(roomId, 'messages', msgs);
    return true;
  }
  return false;
};

// 评分相关方法（隔离存储）
store.getScores = (roomId) => {
  return persistence.rooms.getRoomData(roomId, 'scores');
};

store.addScore = (score) => {
  const scores = persistence.rooms.getRoomData(score.room, 'scores');
  scores.push(score);
  persistence.rooms.setRoomData(score.room, 'scores', scores);
  return score;
};

// 时间事件相关方法（已有）
store.getTimeEvent = (eventName) => {
  return store.timeEvents[eventName];
};

store.setTimeEvent = (eventName, eventData) => {
  store.timeEvents[eventName] = eventData;
};

// 录音相关方法
store.getRecordings = (room) => {
  return store.recordings.filter(r => r.room === room);
};

store.getRecordingById = (recordingId) => {
  return store.recordings.find(r => r.id === recordingId);
};

store.addRecording = (recording) => {
  store.recordings.push(recording);
  return recording;
};

store.deleteRecording = (room, recordingId) => {
  const index = store.recordings.findIndex(r => r.id === recordingId && r.room === room);
  if (index !== -1) {
    store.recordings.splice(index, 1);
    return true;
  }
  return false;
};

// 计时器相关方法
store.startTimer = (roomId, duration) => {
  const room = store.findRoomById(roomId);
  if (!room) return null;
  
  const now = Date.now();
  room.timer = {
    isRunning: true,
    startTime: now,
    duration: duration * 1000, // 转换为毫秒
    remainingTime: duration * 1000,
    lastUpdate: now
  };
  
  return store.updateRoom(room);
};

store.pauseTimer = (roomId) => {
  const room = store.findRoomById(roomId);
  if (!room || !room.timer) return null;
  
  const now = Date.now();
  const elapsed = now - room.timer.lastUpdate;
  const remainingTime = Math.max(0, room.timer.remainingTime - elapsed);
  
  room.timer = {
    ...room.timer,
    isRunning: false,
    remainingTime: remainingTime,
    lastUpdate: now
  };
  
  return store.updateRoom(room);
};

store.resumeTimer = (roomId) => {
  const room = store.findRoomById(roomId);
  if (!room || !room.timer) return null;
  
  room.timer = {
    ...room.timer,
    isRunning: true,
    lastUpdate: Date.now()
  };
  
  return store.updateRoom(room);
};

store.getTimerStatus = (roomId) => {
  const room = store.findRoomById(roomId);
  if (!room || !room.timer) return null;
  
  const now = Date.now();
  let remainingTime = room.timer.remainingTime;
  
  if (room.timer.isRunning) {
    const elapsed = now - room.timer.lastUpdate;
    remainingTime = Math.max(0, room.timer.remainingTime - elapsed);
  }
  
  return {
    isRunning: room.timer.isRunning,
    remainingTime: Math.floor(remainingTime / 1000), // 转回秒
    duration: Math.floor(room.timer.duration / 1000),
    startTime: room.timer.startTime
  };
};

// 日程相关方法
store.updateSchedule = (roomId, schedule) => {
  const room = store.findRoomById(roomId);
  if (!room) return null;
  
  room.schedule = schedule.map((item, index) => ({
    id: item.id || `schedule-${Date.now()}-${index}`,
    name: item.name,
    duration: item.duration,
    completed: item.completed || false,
    order: index
  }));
  
  return store.updateRoom(room);
};

store.getSchedule = (roomId) => {
  const room = store.findRoomById(roomId);
  if (!room) return null;
  
  return room.schedule || [];
};

store.getNextScheduleItem = (roomId) => {
  const schedule = store.getSchedule(roomId);
  if (!schedule || schedule.length === 0) return null;
  
  return schedule.find(item => !item.completed);
};

store.completeScheduleItem = (roomId, itemId) => {
  const room = store.findRoomById(roomId);
  if (!room || !room.schedule) return null;
  
  const item = room.schedule.find(i => i.id === itemId);
  if (!item) return null;
  
  item.completed = true;
  
  return store.updateRoom(room);
};

// 在模块的末尾添加持久化相关方法
store.saveData = function() {
  return persistence.saveCurrentData(this);
};

store.loadData = function() {
  return persistence.loadInitialData(this);
};

// 设置自动保存
store.setupAutoSave = function(intervalMinutes = 5) {
  persistence.setupAutoSave(this, intervalMinutes);
  return this;
};

// 在房间相关方法中添加持久化
const originalAddRoom = store.addRoom;
store.addRoom = function(room) {
  const newRoom = originalAddRoom(room);
  if (newRoom) {
    persistence.rooms.add(newRoom);
  }
  return newRoom;
};

const originalUpdateRoom = store.updateRoom;
store.updateRoom = function(room) {
  const updatedRoom = originalUpdateRoom(room);
  if (updatedRoom) {
    persistence.rooms.update(updatedRoom.id, updatedRoom);
  }
  return updatedRoom;
};

const originalRemoveRoom = store.removeRoom;
store.removeRoom = function(roomId) {
  const result = originalRemoveRoom(roomId);
  if (result) {
    persistence.rooms.remove(roomId);
  }
  return result;
};

// 在消息相关方法中添加持久化
const originalAddMessage = store.addMessage;
store.addMessage = function(message) {
  // 自动补充text字段，兼容textChat统计
  if (!message.text && message.content) {
    message.text = message.content;
  }
  // 生成唯一ID（如无）
  if (!message.id) {
    message.id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  const msgs = persistence.rooms.getRoomData(message.room, 'messages');
  msgs.push(message);
  persistence.rooms.setRoomData(message.room, 'messages', msgs);
  store.messages.push(message);
  return message;
};

const originalUpdateMessage = store.updateMessage;
store.updateMessage = function(message) {
  const updatedMessage = originalUpdateMessage(message);
  if (updatedMessage) {
    const msgs = persistence.rooms.getRoomData(message.room, 'messages');
    const idx = msgs.findIndex(m => m.id === message.id);
    if (idx !== -1) {
      msgs[idx] = updatedMessage;
      persistence.rooms.setRoomData(message.room, 'messages', msgs);
    }
  }
  return updatedMessage;
};

const originalRemoveMessage = store.removeMessage;
store.removeMessage = function(messageId, roomId) {
  const result = originalRemoveMessage(messageId, roomId);
  if (result) {
    const msgs = persistence.rooms.getRoomData(roomId, 'messages');
    const idx = msgs.findIndex(m => m.id === messageId);
    if (idx !== -1) {
      msgs.splice(idx, 1);
      persistence.rooms.setRoomData(roomId, 'messages', msgs);
    }
  }
  return result;
};

// 在用户相关方法中添加持久化
const originalAddUser = store.addUser;
store.addUser = function(user) {
  const newUser = originalAddUser(user);
  if (newUser) {
    persistence.users.add(newUser);
  }
  return newUser;
};

// 图片相关方法（隔离存储）
store.getImages = (roomId) => {
  return persistence.rooms.getRoomData(roomId, 'images');
};

store.addImage = (image) => {
  const imgs = persistence.rooms.getRoomData(image.roomId, 'images');
  imgs.push(image);
  persistence.rooms.setRoomData(image.roomId, 'images', imgs);
  return image;
};

store.getImageById = (imageId, roomId) => {
  const imgs = persistence.rooms.getRoomData(roomId, 'images');
  return imgs.find(img => img.id === imageId);
};

store.removeImage = (imageId, roomId) => {
  let imgs = persistence.rooms.getRoomData(roomId, 'images');
  const idx = imgs.findIndex(img => img.id === imageId);
  if (idx !== -1) {
    imgs.splice(idx, 1);
    persistence.rooms.setRoomData(roomId, 'images', imgs);
    return true;
  }
  return false;
};

// 语音消息相关方法
store.getVoiceMessageById = (voiceId) => {
  return store.voiceMessages.find(voice => voice.id === voiceId);
};

store.addVoiceMessage = (voiceMessage) => {
  store.voiceMessages.push(voiceMessage);
  return voiceMessage;
};

store.removeVoiceMessage = (voiceId) => {
  const index = store.voiceMessages.findIndex(voice => voice.id === voiceId);
  if (index !== -1) {
    store.voiceMessages.splice(index, 1);
    return true;
  }
  return false;
};

store.getVoiceMessagesByRoom = (roomId) => {
  return store.voiceMessages.filter(voice => voice.room === roomId);
};

// 消息日志相关方法
store.addMessageLog = (logEntry) => {
  store.messageLogs.push({
    id: Date.now().toString(),
    ...logEntry,
    timestamp: logEntry.timestamp || new Date().toISOString()
  });
  
  // 限制日志数量，避免内存溢出
  if (store.messageLogs.length > 10000) {
    store.messageLogs = store.messageLogs.slice(-5000);
  }
  
  return store.messageLogs[store.messageLogs.length - 1];
};

store.getMessageLogs = (roomId, action, startDate, endDate, limit = 50) => {
  let logs = store.messageLogs.filter(log => {
    // 按房间过滤
    if (log.roomId && log.roomId !== roomId) return false;
    
    // 按操作类型过滤
    if (action && log.action !== action) return false;
    
    // 按时间范围过滤
    if (startDate && new Date(log.timestamp) < new Date(startDate)) return false;
    if (endDate && new Date(log.timestamp) > new Date(endDate)) return false;
    
    return true;
  });
  
  // 按时间倒序排序
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // 限制返回数量
  return logs.slice(0, limit);
};

// 系统日志相关方法
store.addSystemLog = (logEntry) => {
  store.systemLogs.push({
    id: Date.now().toString(),
    ...logEntry,
    timestamp: logEntry.timestamp || new Date().toISOString()
  });
  
  // 限制日志数量
  if (store.systemLogs.length > 10000) {
    store.systemLogs = store.systemLogs.slice(-5000);
  }
  
  return store.systemLogs[store.systemLogs.length - 1];
};

store.getSystemLogs = (type, startDate, endDate, limit = 100) => {
  let logs = store.systemLogs.filter(log => {
    // 按类型过滤
    if (type && log.type !== type) return false;
    
    // 按时间范围过滤
    if (startDate && new Date(log.timestamp) < new Date(startDate)) return false;
    if (endDate && new Date(log.timestamp) > new Date(endDate)) return false;
    
    return true;
  });
  
  // 按时间倒序排序
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // 限制返回数量
  return logs.slice(0, limit);
};

// 表情统计相关方法
store.updateEmojiStats = (roomId, emojiId, count = 1) => {
  if (!store.emojiStats[roomId]) {
    store.emojiStats[roomId] = {};
  }
  
  if (!store.emojiStats[roomId][emojiId]) {
    store.emojiStats[roomId][emojiId] = 0;
  }
  
  store.emojiStats[roomId][emojiId] += count;
};

store.getEmojiStats = (roomId) => {
  return store.emojiStats[roomId] || {};
};

// 获取单个消息的方法（用于消息管理）
store.getMessage = (messageId) => {
  return store.messages.find(m => m.id === messageId);
};

// 用户相关方法（隔离存储）
store.getRoomUsers = (roomId) => {
  return persistence.rooms.getRoomData(roomId, 'users');
};

store.addRoomUser = (roomId, user) => {
  const users = persistence.rooms.getRoomData(roomId, 'users');
  users.push(user);
  persistence.rooms.setRoomData(roomId, 'users', users);
  return user;
};

store.updateRoomUser = (roomId, userId, updates) => {
  const users = persistence.rooms.getRoomData(roomId, 'users');
  const idx = users.findIndex(u => u.userId === userId);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates };
    persistence.rooms.setRoomData(roomId, 'users', users);
    return users[idx];
  }
  return null;
};

store.removeRoomUser = (roomId, userId) => {
  let users = persistence.rooms.getRoomData(roomId, 'users');
  const idx = users.findIndex(u => u.userId === userId);
  if (idx !== -1) {
    users.splice(idx, 1);
    persistence.rooms.setRoomData(roomId, 'users', users);
    return true;
  }
  return false;
};

// 页面配置相关方法（隔离存储）
store.getRoomConfig = (roomId) => {
  return persistence.rooms.getRoomData(roomId, 'config');
};

store.setRoomConfig = (roomId, config) => {
  persistence.rooms.setRoomData(roomId, 'config', config);
  return config;
};

// 初始化并加载持久化数据
store.loadData();

module.exports = store; 