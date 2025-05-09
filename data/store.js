"use strict";
const bcrypt = require('bcryptjs');

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

module.exports = store; 