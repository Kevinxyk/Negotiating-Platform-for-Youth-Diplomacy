const express = require('express');
const router = express.Router();
const messageManagementController = require('../controllers/messageManagementController');
const { requireAuth, requireRole } = require('../middleware/auth');

// 获取所有消息（管理员权限）
router.get('/messages', requireAuth, requireRole(['admin', 'sys']), messageManagementController.getAllMessages);

// 编辑消息（管理员权限）
router.put('/messages/:id/edit', requireAuth, requireRole(['admin', 'sys']), messageManagementController.editMessage);

// 撤销消息（管理员权限）
router.put('/messages/:id/revoke', requireAuth, requireRole(['admin', 'sys']), messageManagementController.revokeMessage);

// 删除消息（管理员权限）
router.delete('/messages/:id', requireAuth, requireRole(['admin', 'sys']), messageManagementController.deleteMessage);

// 获取消息统计信息（管理员权限）
router.get('/messages/stats', requireAuth, requireRole(['admin', 'sys']), messageManagementController.getMessageStats);

module.exports = router; 