// my-backend/controllers/textChatController.js
"use strict";
const textChatService = require("../services/textChatService");

/**
 * GET  /api/chat/:room/messages
 */
async function getChatHistory(req, res) {
  try {
    const room   = req.params.room;
    const limit  = parseInt(req.query.limit,  10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;

    let msgs = await textChatService.getHistory(room, limit, offset);
    msgs = msgs.filter(m => !m.revoked);
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/chat/:room/send
 */
async function sendMessage(req, res) {
  try {
    const room = req.params.room;
    const message = await textChatService.saveMessage(room, {
      ...req.body,
      username: req.user.username,  // 使用认证用户的信息
      role: req.user.role
    });
    res.status(201).json({ status: "ok", message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/chat/:room/message/:messageId/revoke
 */
async function revokeMessage(req, res) {
  try {
    const id = req.params.messageId;
    const message = await textChatService.getMessageById(id);
    
    // 检查权限：只有消息作者或管理员可以撤回
    if (message.username !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ error: '没有权限撤回此消息' });
    }

    await textChatService.revokeMessage(id);
    res.json({ status: "revoked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/chat/:room/summary/user
 * （老接口：只返回 username → count，以免破坏集成测试）
 */
async function getUserSummary(req, res) {
  try {
    const room = req.params.room;
    const raw  = await textChatService.getUserSummary(room);
    // raw: { [username]: { count: Number, messages: Array<msg> } }
    const simple = {};
    Object.keys(raw).forEach(u => {
      simple[u] = raw[u].count;
    });
    res.json(simple);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/chat/:room/summary/time
 * （老接口：只返回 hour → count，以免破坏集成测试）
 */
async function getTimeSummary(req, res) {
  try {
    const room = req.params.room;
    const raw  = await textChatService.getTimeSummary(room);
    // raw: { [hour]: { count: Number, messages: Array<msg> } }
    const simple = {};
    Object.keys(raw).forEach(h => {
      simple[h] = raw[h].count;
    });
    res.json(simple);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/chat/:room/summary/user/details
 * （新接口：把 count + messages 都返回，用于前端展示）
 */
async function getUserSummaryDetail(req, res) {
  try {
    const room = req.params.room;
    const raw  = await textChatService.getUserSummary(room);
    res.json(raw);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/chat/:room/summary/time/details
 * （新接口：把 count + messages 都返回，用于前端展示）
 */
async function getTimeSummaryDetail(req, res) {
  try {
    const room = req.params.room;
    const raw  = await textChatService.getTimeSummary(room);
    res.json(raw);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/chat/:room/search
 */
async function searchChat(req, res) {
  try {
    const room    = req.params.room;
    const keyword = req.query.keyword || "";
    const results = await textChatService.searchMessages(room, keyword);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getChatHistory,
  sendMessage,
  revokeMessage,
  getUserSummary,
  getTimeSummary,
  getUserSummaryDetail,
  getTimeSummaryDetail,
  searchChat
};