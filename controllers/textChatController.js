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
    const message = await textChatService.saveMessage(room, req.body);
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
    await textChatService.revokeMessage(id);
    res.json({ status: "revoked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/chat/:room/summary/user
 */
async function getUserSummary(req, res) {
  try {
    const room = req.params.room;
    const summary = await textChatService.getUserSummary(room);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/chat/:room/summary/time
 */
async function getTimeSummary(req, res) {
  try {
    const room = req.params.room;
    const summary = await textChatService.getTimeSummary(room);
    res.json(summary);
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
  searchChat
};