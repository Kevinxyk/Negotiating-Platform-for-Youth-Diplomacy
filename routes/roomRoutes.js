"use strict";
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/roomController');

// 获取当前用户的所有研讨室
router.get('/', verifyToken, ctrl.getRooms);

// 获取单个研讨室
router.get('/:roomId', verifyToken, ctrl.getRoom);

// 创建新研讨室（仅 host、admin、sys）
router.post('/',
  verifyToken,
  requireRoles(['host','admin','sys']),
  ctrl.createRoom
);

// 加入现有研讨室（所有登录用户）
router.post('/join',
  verifyToken,
  ctrl.joinRoom
);

module.exports = router; 