const express = require('express');
const router = express.Router();
const { 
  getSystemOverview,
  getUserList,
  updateUser,
  deleteUser,
  getRoomList,
  updateRoom,
  deleteRoom,
  getSystemLogs,
  getFileManagement,
  cleanupFiles
} = require('../controllers/adminController');
const { verifyToken, requireRoles } = require('../middleware/auth');
const userManagementController = require('../controllers/userManagementController');

// 管理员权限中间件
const requireAdmin = requireRoles(['admin', 'sys']);

// 系统概览
router.get('/overview', verifyToken, requireAdmin, getSystemOverview);

// 用户管理
router.get('/users', verifyToken, requireAdmin, getUserList);
router.put('/users/:userId', verifyToken, requireAdmin, updateUser);
router.delete('/users/:userId', verifyToken, requireAdmin, deleteUser);

// 房间管理
router.get('/rooms', verifyToken, requireAdmin, getRoomList);
router.put('/rooms/:roomId', verifyToken, requireAdmin, updateRoom);
router.delete('/rooms/:roomId', verifyToken, requireAdmin, deleteRoom);

// 系统日志
router.get('/logs', verifyToken, requireAdmin, getSystemLogs);

// 文件管理
router.get('/files', verifyToken, requireAdmin, getFileManagement);
router.post('/files/cleanup', verifyToken, requireAdmin, cleanupFiles);

// 用户管理（实时状态）
router.get('/users', verifyToken, requireRoles(['admin', 'sys', 'host', 'judge']), userManagementController.getRoomUsers);
router.put('/users/:userId/status', verifyToken, requireRoles(['admin', 'sys', 'host', 'judge']), userManagementController.updateUserStatus);
router.get('/users/stats', verifyToken, requireRoles(['admin', 'sys', 'host', 'judge']), userManagementController.getUserStats);

// 系统管理
router.get('/system/logs', verifyToken, requireRoles(['admin', 'sys']), getSystemLogs);

module.exports = router; 