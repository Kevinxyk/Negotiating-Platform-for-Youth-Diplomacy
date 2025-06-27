const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadVoice, getVoice, getRoomVoiceMessages, deleteVoice } = require('../controllers/voiceController');
const { verifyToken } = require('../middleware/auth');

const voiceDir = path.join(__dirname, '../uploads/voice');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, voiceDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9\.\-]/g, '_');
    cb(null, `voice_${timestamp}_${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  // 支持音频格式
  if (file.mimetype.startsWith('audio/') || 
      file.mimetype === 'audio/wav' ||
      file.mimetype === 'audio/mp3' ||
      file.mimetype === 'audio/mpeg' ||
      file.mimetype === 'audio/ogg' ||
      file.mimetype === 'audio/webm') {
    cb(null, true);
  } else {
    cb(new Error('只允许上传音频文件'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter, 
  limits: { 
    fileSize: 50 * 1024 * 1024 // 50MB
  } 
});

// 上传语音消息
router.post('/upload', verifyToken, upload.single('voice'), uploadVoice);

// 获取语音消息
router.get('/:voiceId', getVoice);

// 获取房间语音消息列表
router.get('/room/:roomId', verifyToken, getRoomVoiceMessages);

// 删除语音消息
router.delete('/:voiceId', verifyToken, deleteVoice);

module.exports = router; 