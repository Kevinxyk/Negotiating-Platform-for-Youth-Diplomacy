const path = require('path');
const fs = require('fs');
const store = require('../data/store');

const voiceDir = path.join(__dirname, '../uploads/voice');
if (!fs.existsSync(voiceDir)) {
  fs.mkdirSync(voiceDir, { recursive: true });
}

// 上传语音消息
async function uploadVoice(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: '未上传语音文件' });
  }
  
  // 存储语音消息元数据
  const voiceMessage = {
    id: Date.now().toString(),
    filename: req.file.filename,
    originalname: req.file.originalname,
    uploader: req.user.username,
    uploadTime: new Date().toISOString(),
    mimetype: req.file.mimetype,
    size: req.file.size,
    duration: req.body.duration || 0,
    room: req.body.room || 'main'
  };
  
  store.addVoiceMessage(voiceMessage);
  
  res.status(201).json({ status: 'ok', voiceMessage });
}

// 获取语音消息
async function getVoice(req, res) {
  const voiceId = req.params.voiceId;
  const voiceMessage = store.getVoiceMessageById(voiceId);
  
  if (!voiceMessage) {
    return res.status(404).json({ error: '语音消息不存在' });
  }
  
  const filePath = path.join(voiceDir, voiceMessage.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '语音文件不存在' });
  }
  
  res.sendFile(filePath);
}

// 获取房间语音消息列表
async function getRoomVoiceMessages(req, res) {
  const roomId = req.params.roomId;
  const voiceMessages = store.getVoiceMessagesByRoom(roomId)
    .sort((a, b) => new Date(a.uploadTime) - new Date(b.uploadTime));
  
  res.json({ status: 'ok', voiceMessages });
}

// 删除语音消息
async function deleteVoice(req, res) {
  const voiceId = req.params.voiceId;
  const voiceMessage = store.getVoiceMessageById(voiceId);
  
  if (!voiceMessage) {
    return res.status(404).json({ error: '语音消息不存在' });
  }
  
  // 检查权限：只有上传者或管理员可以删除
  if (voiceMessage.uploader !== req.user.username && 
      !['admin', 'sys', 'host'].includes(req.user.role)) {
    return res.status(403).json({ error: '没有权限删除此语音消息' });
  }
  
  // 删除文件
  const filePath = path.join(voiceDir, voiceMessage.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  
  // 从存储中移除
  store.removeVoiceMessage(voiceId);
  
  res.json({ status: 'ok', message: '语音消息已删除' });
}

module.exports = {
  uploadVoice,
  getVoice,
  getRoomVoiceMessages,
  deleteVoice
}; 