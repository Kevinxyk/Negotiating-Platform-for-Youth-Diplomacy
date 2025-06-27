const express = require('express');
const router = express.Router();
const { getEmojiList, getEmojiCategories, getEmojiStats } = require('../controllers/emojiController');
const { verifyToken } = require('../middleware/auth');

// 获取表情列表
router.get('/', getEmojiList);

// 获取表情分类
router.get('/categories', getEmojiCategories);

// 获取表情统计（需要认证）
router.get('/stats/:roomId', verifyToken, getEmojiStats);

module.exports = router; 