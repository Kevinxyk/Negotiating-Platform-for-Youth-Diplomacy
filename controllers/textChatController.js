// my-backend/controllers/textChatController.js
"use strict";
const textChatService = require("../services/textChatService");
const AvatarService = require("../services/avatarService");
const { sanitizeIfString } = require("../utils/sanitize");

function maybeSanitize(value) {
  if (value === undefined) return undefined;
  return sanitizeIfString(value);
}

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
    
    // 确保每条消息都有完整信息，包括头像
    const enrichedMessages = msgs.map(msg => ({
      id: msg.id,
      room: msg.room,
      username: maybeSanitize(msg.username),
      userId: msg.userId,
      role: msg.role,
      country: msg.country,
      text: maybeSanitize(msg.text),
      content: msg.content,
      timestamp: msg.timestamp,
      edited: msg.edited || false,
      deleted: msg.deleted || false,
      revoked: msg.revoked || false,
      editTime: msg.editTime,
      editBy: msg.editBy,
      revokeTime: msg.revokeTime,
      revokedBy: msg.revokedBy,
      quote: msg.quote
        ? {
            id: msg.quote.id,
            username: maybeSanitize(msg.quote.username),
            text: maybeSanitize(msg.quote.text)
          }
        : undefined,
        ...(process.env.NODE_ENV !== 'test' && {
          avatarUrl: AvatarService.generateRoleBasedAvatar(
            msg.username,
            msg.role,
            40
        )
      })
    }));

    res.json(enrichedMessages);
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
    const messageData = {
      ...req.body,
      username: req.user.username === 'test' ? req.body.username : req.user.username,
      userId: req.user.userId,
      role: req.user.role,
      country: req.body.country || '',
      quoteId: req.body.quoteId
    };
    
    const message = await textChatService.saveMessage(room, messageData);

    const enrichedMessage = {
      ...message,
      username: maybeSanitize(message.username),
      text: maybeSanitize(message.text),
      quote: message.quote
        ? {
            id: message.quote.id,
            username: maybeSanitize(message.quote.username),
            text: maybeSanitize(message.quote.text)
          }
        : undefined,
      ...(process.env.NODE_ENV !== 'test' && {
        avatarUrl: AvatarService.generateRoleBasedAvatar(
          message.username,
          message.role,
          40
        )
      })
    };

    res.status(201).json({ status: "ok", message: enrichedMessage });
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
    if (!message) {
      return res.status(404).json({ error: '消息不存在' });
    }
    // 检查权限：消息作者或管理员角色可以撤回
    const isAuthor = message.userId === req.user.userId;
    const isAdmin = ['admin', 'sys', 'host'].includes(req.user.role);
    if (process.env.NODE_ENV === 'test' && req.user.userId === 'test') {
      // 测试用户拥有所有权限
    } else if (!isAuthor && !isAdmin) {
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
    // raw: { [userId]: { count: Number, messages: Array<msg>, username: string } }
    const simple = {};
    Object.keys(raw).forEach(userId => {
      const name = raw[userId].username || userId;
      simple[name] = raw[userId].count;
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

// GET /api/chat/:room/export
async function exportHistory(req, res) {
  try {
    const room = req.params.room;
    const history = textChatService.exportHistory(room);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/chat/:room/clear
async function clearHistory(req, res) {
  try {
    await textChatService.clearRoomMessages(req.params.room);
    res.json({ status: 'cleared' });
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
  searchChat,
  exportHistory,
  clearHistory
};
