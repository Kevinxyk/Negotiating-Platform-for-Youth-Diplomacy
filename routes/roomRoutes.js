"use strict";
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/roleMiddleware');
const {
  getRooms,
  createRoom,
  getRoom,
  joinRoom,
  deleteRoom,
  updateRoom,
  joinRoomByInviteCode,
  leaveRoom,
  updateParticipantRole,
  sendMessage,
  editMessage,
  deleteMessage,
  startTimer,
  pauseTimer,
  resumeTimer,
  getTimerStatus,
  updateSchedule,
  getSchedule,
  startScheduleItem,
  pauseScheduleItem,
  resumeScheduleItem,
  nextScheduleItem,
  getMessages
} = require('../controllers/roomController');

// 获取当前用户的所有研讨室
router.get('/', verifyToken, getRooms);

// 获取单个研讨室
router.get('/:id', verifyToken, getRoom);

// 创建新研讨室（仅 host、admin、sys）
router.post('/',
  verifyToken,
  requireRoles(['host','admin','sys']),
  createRoom
);

// 加入现有研讨室（所有登录用户）
router.post('/:id/join',
  verifyToken,
  joinRoom
);

// 删除研讨室（仅创建者）
router.delete('/:id',
  verifyToken,
  deleteRoom
);

// 更新研讨室参数（仅创建者）
router.put('/:id',
  verifyToken,
  updateRoom
);

// 通过邀请码加入研讨室
router.post('/join-by-invite',
  verifyToken,
  joinRoomByInviteCode
);

// 离开房间
router.post('/:id/leave',
  verifyToken,
  leaveRoom
);

// 更新参与者角色
router.put('/:id/participants/:userId/role',
  verifyToken,
  updateParticipantRole
);

// 日程管理
router.put('/:id/schedule',
  verifyToken,
  requireRoles(['host','admin','sys']),
  updateSchedule
);

router.get('/:id/schedule',
  verifyToken,
  getSchedule
);

// 日程控制
router.post('/:id/schedule/start',
  verifyToken,
  requireRoles(['host','admin','sys']),
  startScheduleItem
);

router.post('/:id/schedule/pause',
  verifyToken,
  requireRoles(['host','admin','sys']),
  pauseScheduleItem
);

router.post('/:id/schedule/resume',
  verifyToken,
  requireRoles(['host','admin','sys']),
  resumeScheduleItem
);

router.post('/:id/schedule/next',
  verifyToken,
  requireRoles(['host','admin','sys']),
  nextScheduleItem
);

// 消息管理
router.get('/:id/messages',
  verifyToken,
  getMessages
);

router.post('/:id/messages',
  verifyToken,
  sendMessage
);

router.put('/:id/messages/:messageId',
  verifyToken,
  editMessage
);

router.delete('/:id/messages/:messageId',
  verifyToken,
  deleteMessage
);

// 计时器控制
router.post('/:id/timer/start',
  verifyToken,
  requireRoles(['host','admin','sys']),
  startTimer
);

router.post('/:id/timer/pause',
  verifyToken,
  requireRoles(['host','admin','sys']),
  pauseTimer
);

router.post('/:id/timer/resume',
  verifyToken,
  requireRoles(['host','admin','sys']),
  resumeTimer
);

router.get('/:id/timer',
  verifyToken,
  getTimerStatus
);

module.exports = router; 