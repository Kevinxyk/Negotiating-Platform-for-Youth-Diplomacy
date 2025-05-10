"use strict";
const bcrypt = require('bcryptjs');

// 导入数据持久化模块
const persistence = require('./persistence');

// 内存存储
const store = {
  // 用户存储
  users: [
    {
      userId: '1',
      username: 'admin',
      passwordHash: bcrypt.hashSync('admin123', 10),
      role: 'admin'
    },
    {
      userId: '2',
      username: 'host',
      passwordHash: bcrypt.hashSync('host123', 10),
      role: 'host'
    },
    {
      userId: '3',
      username: 'sys',
      passwordHash: bcrypt.hashSync('sys123', 10),
      role: 'sys'
    },
    {
      userId: '4',
      username: 'student',
      passwordHash: bcrypt.hashSync('student123', 10),
      role: 'student'
    },
    {
      userId: '5',
      username: 'observer',
      passwordHash: bcrypt.hashSync('observer123', 10),
      role: 'observer'
    },
    {
      userId: '6',
      username: 'judge',
      passwordHash: bcrypt.hashSync('judge123', 10),
      role: 'judge'
    },
    {
      userId: '7',
      username: 'delegate',
      passwordHash: bcrypt.hashSync('delegate123', 10),
      role: 'delegate'
    }
  ],

  // 房间存储
  rooms: [],

  // 消息存储（已有）
  messages: [],

  // 评分存储（已有）
  scores: [],

  // 时间事件存储（已有）
  timeEvents: {},

  // 录音存储
  recordings: []
};

// 用户相关方法
store.findUserByUsername = (username) => {
  return store.users.find(u => u.username === username);
};

store.findUserById = (userId) => {
  return store.users.find(u => u.userId === userId);
};

store.addUser = (user) => {
  const newUser = {
    userId: String(store.users.length + 1),
    ...user
  };
  store.users.push(newUser);
  return newUser;
};

// 房间相关方法
store.findRoomById = (roomId) => {
  return store.rooms.find(r => r.id === roomId);
};

store.findRoomByInviteCode = (inviteCode) => {
  return store.rooms.find(r => r.inviteCode === inviteCode);
};

store.addRoom = (room) => {
  // 生成邀请码
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const newRoom = {
    ...room,
    id: String(Date.now()),
    inviteCode,
    createdAt: new Date().toISOString(),
    schedule: room.schedule || [],
    timer: {
      isRunning: false,
      startTime: null,
      duration: 0,
      remainingTime: 0,
      lastUpdate: null
    },
    settings: {
      autoSchedule: false,
      allowMessageDelete: true,
      allowMessageEdit: true,
      allowRaiseHand: true,
      allowVoiceChat: true,
      ...room.settings
    }
  };
  store.rooms.push(newRoom);
  return newRoom;
};

store.updateRoom = (room) => {
  const index = store.rooms.findIndex(r => r.id === room.id);
  if (index !== -1) {
    // 保留原有的计时器状态
    const timer = store.rooms[index].timer;
    store.rooms[index] = {
      ...store.rooms[index],
      ...room,
      timer: room.timer || timer,
      updatedAt: new Date().toISOString()
    };
    return store.rooms[index];
  }
  return null;
};

store.removeRoom = (roomId) => {
  const index = store.rooms.findIndex(r => r.id === roomId);
  if (index !== -1) {
    store.rooms.splice(index, 1);
    return true;
  }
  return false;
};

// 消息相关方法（已有）
store.getMessages = (room, limit = 50, offset = 0) => {
  return store.messages
    .filter(m => m.room === room)
    .slice(offset, offset + limit);
};

store.addMessage = (message) => {
  store.messages.push(message);
  return message;
};

store.findMessageById = (messageId) => {
  return store.messages.find(m => m.id === messageId);
};

store.updateMessage = (message) => {
  const index = store.messages.findIndex(m => m.id === message.id);
  if (index !== -1) {
    store.messages[index] = {
      ...store.messages[index],
      ...message,
      updatedAt: new Date().toISOString()
    };
    return store.messages[index];
  }
  return null;
};

store.removeMessage = (messageId) => {
  const index = store.messages.findIndex(m => m.id === messageId);
  if (index !== -1) {
    store.messages.splice(index, 1);
    return true;
  }
  return false;
};

// 评分相关方法（已有）
store.getScores = (room) => {
  return store.scores.filter(s => s.room === room);
};

store.addScore = (score) => {
  store.scores.push(score);
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

store.addRecording = (recording) => {
  store.recordings.push(recording);
  return recording;
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
  const newMessage = originalAddMessage(message);
  if (newMessage) {
    persistence.messages.add(newMessage);
  }
  return newMessage;
};

const originalUpdateMessage = store.updateMessage;
store.updateMessage = function(message) {
  const updatedMessage = originalUpdateMessage(message);
  if (updatedMessage) {
    persistence.messages.update(updatedMessage.id, updatedMessage);
  }
  return updatedMessage;
};

const originalRemoveMessage = store.removeMessage;
store.removeMessage = function(messageId) {
  const result = originalRemoveMessage(messageId);
  if (result) {
    persistence.messages.remove(messageId);
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

// 初始化并加载持久化数据
store.loadData();

module.exports = store; 