// File: my-backend/data/timeData.js
"use strict";

/**
 * timeEvents 存储各事件的状态和计时信息
 * 结构：
 * {
 *   [eventKey]: {
 *     label: string,           // 阶段名
 *     targetTime: ISOString,   // 结束时间
 *     durationSec: number,      // 原始持续时长（秒）
 *     remainingSec: number,     // 暂停时剩余秒数
 *     state: 'running'|'paused'  // 当前状态
 *   }
 * }
 */
const timeEvents = {};

module.exports = { timeEvents };

// 固定的测试时间数据
module.exports.timeData = {
  year:   2020,
  month:  1,
  day:    1,
  hour:   0,
  minute: 0,
  second: 0
};