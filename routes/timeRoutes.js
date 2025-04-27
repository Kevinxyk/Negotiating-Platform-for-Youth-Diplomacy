// File: my-backend/routes/timeRoutes.js
"use strict";

const express = require('express');
const router = express.Router();
const {
  nowHandler,
  stateHandler,
  scheduleHandler,
  pauseHandler,
  resumeHandler,
  editHandler
} = require('../controllers/timeController');

// 健康检查或一键当前时间
router.get('/now', nowHandler);

// 获取事件状态
router.get('/:event/state', stateHandler);

// 调度新倒计时
router.post('/:event/schedule', scheduleHandler);

// 暂停事件
router.post('/:event/pause', pauseHandler);

// 继续事件
router.post('/:event/resume', resumeHandler);

// 编辑事件持续时长
router.post('/:event/edit', editHandler);

module.exports = router;
