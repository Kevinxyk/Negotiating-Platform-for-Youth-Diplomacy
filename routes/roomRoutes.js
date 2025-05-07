"use strict";
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/roomController');

// 获取当前用户的所有研讨室
router.get('/', verifyToken, ctrl.getRooms);

// 创建新研讨室（仅 host、admin）
router.post('/',
  verifyToken,
  requireRoles(['host','admin']),
  ctrl.createRoom
);

module.exports = router; 