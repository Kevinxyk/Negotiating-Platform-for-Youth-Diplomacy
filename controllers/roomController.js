"use strict";
const roomService = require('../services/roomService');

// 列出当前用户的研讨室
async function getRooms(req, res) {
  try {
    const userId = req.user.userId;
    const rooms = roomService.getRoomsByUser(userId);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// 创建新研讨室
async function createRoom(req, res) {
  try {
    const { name, description, maxParticipants, isPrivate } = req.body;
    if (!name) {
      return res.status(400).json({ error: '房间名称是必填项' });
    }
    const createdBy = req.user.userId;
    const room = roomService.createRoom({ name, description, createdBy, maxParticipants, isPrivate });
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// 获取单个研讨室
async function getRoom(req, res) {
  try {
    const { roomId } = req.params;
    const room = roomService.getRoomById(roomId);
    if (!room) {
      return res.status(404).json({ error: '研讨室不存在' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// 加入现有研讨室
async function joinRoom(req, res) {
  try {
    const { name } = req.body;
    const room = roomService.getRoomByName(name);
    if (!room) {
      return res.status(404).json({ error: '研讨室不存在' });
    }
    roomService.addMember(room.id, req.user.userId);
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getRooms,
  createRoom,
  getRoom,
  joinRoom
}; 