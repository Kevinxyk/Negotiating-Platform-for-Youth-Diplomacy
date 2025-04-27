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