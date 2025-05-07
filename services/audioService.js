"use strict";
const store = require("../data/store");

// 保存录音
async function saveRecording(room, { audioData, title, description, uploader, uploaderRole }) {
  const recording = {
    id: Date.now().toString(),
    room,
    audioData,
    title,
    description,
    uploader,
    uploaderRole,
    uploadTime: new Date().toISOString(),
    status: 'ready'  // ready, playing, paused
  };

  return store.addRecording(recording);
}

// 控制录音播放
async function controlRecording(room, recordingId, { action, operator, operatorRole }) {
  const recording = store.getRecordingById(recordingId);
  if (!recording) {
    throw new Error('录音不存在');
  }

  switch (action) {
    case 'play':
      recording.status = 'playing';
      break;
    case 'pause':
      recording.status = 'paused';
      break;
    case 'stop':
      recording.status = 'ready';
      break;
    default:
      throw new Error('无效的操作');
  }

  return recording;
}

// 获取录音列表
async function getRecordings(room) {
  return store.getRecordings(room);
}

// 获取单个录音
async function getRecordingById(recordingId) {
  return store.getRecordingById(recordingId);
}

// 删除录音
async function deleteRecording(room, recordingId) {
  return store.deleteRecording(room, recordingId);
}

module.exports = {
  saveRecording,
  controlRecording,
  getRecordings,
  getRecordingById,
  deleteRecording
}; 