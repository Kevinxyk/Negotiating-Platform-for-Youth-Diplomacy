const express = require('express');
const router = express.Router();
const { 
  editMessage, 
  revokeMessage, 
  getMessageHistory, 
  getMessageLogs, 
  getMessageStats, 
  batchMessageAction 
} = require('../controllers/messageController');
const { verifyToken } = require('../middleware/auth');

// 编辑消息
router.put('/:messageId', verifyToken, editMessage);

// 撤销消息
router.delete('/:messageId', verifyToken, revokeMessage);

// 获取消息历史
router.get('/history/:roomId', verifyToken, getMessageHistory);

// 获取消息日志
router.get('/logs/:roomId', verifyToken, getMessageLogs);

// 获取消息统计
router.get('/stats/:roomId', verifyToken, getMessageStats);

// 批量操作消息（管理员功能）
router.post('/batch', verifyToken, batchMessageAction);

module.exports = router; 