"use strict";
const roomService = require('../services/roomService');
const store = require('../data/store');
const { generateToken } = require('../middleware/auth');

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
    const { name, description, maxParticipants, isPrivate, schedule, settings } = req.body;
    const user = store.findUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 格式化日程数据
    let formattedSchedule = [];
    if (schedule && Array.isArray(schedule)) {
      formattedSchedule = schedule.map((item, index) => {
        // 检查是否使用旧格式（duration.hours, duration.minutes, duration.seconds）
        let totalSeconds = 0;
        if (item.duration && typeof item.duration === 'object') {
          const hours = parseInt(item.duration.hours) || 0;
          const minutes = parseInt(item.duration.minutes) || 0;
          const seconds = parseInt(item.duration.seconds) || 0;
          totalSeconds = hours * 3600 + minutes * 60 + seconds;
        } else {
          totalSeconds = parseInt(item.duration) || 0;
        }
        
        return {
          id: item.id || `schedule-${Date.now()}-${index}`,
          name: item.name || `日程 ${index + 1}`,
          duration: totalSeconds,
          completed: item.completed || false,
          order: index
        };
      });
    }

    const room = store.addRoom({
      name,
      description,
      maxParticipants: maxParticipants || 10,
      isPrivate: isPrivate || false,
      createdBy: user.userId,
      participants: [{
        userId: user.userId,
        role: user.role,
        joinedAt: new Date().toISOString()
      }],
      schedule: formattedSchedule,
      settings: settings || {}
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// 获取单个研讨室
async function getRoom(req, res) {
  try {
    const roomId = req.params.id;
    const user = store.findUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const room = store.findRoomById(roomId);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }

    // 添加用户信息
    const roomWithUsers = {
      ...room,
      participants: room.participants.map(p => ({
        ...p,
        user: store.findUserById(p.userId)
      }))
    };

    res.json(roomWithUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// 加入现有研讨室
async function joinRoom(req, res) {
  try {
    const room = store.findRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }
    
    const user = store.findUserById(req.user.userId);
    
    // 检查是否已加入
    if (room.participants.some(p => p.user === user.userId)) {
      return res.status(400).json({ error: '已经加入该房间' });
    }
    
    // 检查人数限制
    if (room.participants.length >= room.maxParticipants) {
      return res.status(400).json({ error: '房间已满' });
    }
    
    // 添加参与者
    room.participants.push({
      user: user.userId,
      role: 'observer'
    });
    
    store.updateRoom(room);
    
    // 生成房间访问令牌
    const token = generateToken(user);
    
    res.json({ room, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 删除研讨室
async function deleteRoom(req, res) {
  try {
    const room = store.findRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }
    
    // 检查权限
    const user = store.findUserById(req.user.userId);
    if (!room.participants.some(p => p.user === user.userId && p.role === 'admin')) {
      return res.status(403).json({ error: '没有权限删除房间' });
    }
    
    store.removeRoom(room.id);
    res.json({ message: '房间已删除' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 更新研讨室参数
async function updateRoom(req, res) {
  try {
    const roomId = req.params.id;
    const updates = req.body;
    const user = store.findUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const room = store.findRoomById(roomId);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }

    // 检查权限
    if (room.createdBy !== user.userId && !['admin', 'sys'].includes(user.role)) {
      return res.status(403).json({ error: '没有权限修改房间' });
    }

    // 更新房间信息
    const updatedRoom = store.updateRoom({
      ...room,
      ...updates,
      id: roomId
    });

    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// 通过邀请码加入研讨室
async function joinRoomByInviteCode(req, res) {
  try {
    const { inviteCode } = req.body;
    
    const room = store.findRoomByInviteCode(inviteCode);
    if (!room) {
      return res.status(404).json({ error: '无效的邀请码' });
    }
    
    const user = store.findUserById(req.user.userId);
    
    // 检查是否已加入
    if (room.participants.some(p => p.user === user.userId)) {
      return res.status(400).json({ error: '已经加入该房间' });
    }
    
    // 检查人数限制
    if (room.participants.length >= room.maxParticipants) {
      return res.status(400).json({ error: '房间已满' });
    }
    
    // 添加参与者
    room.participants.push({
      user: user.userId,
      role: 'observer'
    });
    
    store.updateRoom(room);
    
    // 生成房间访问令牌
    const token = generateToken(user);
    
    res.json({ room, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 离开房间
async function leaveRoom(req, res) {
  try {
    const room = store.findRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }
    
    const user = store.findUserById(req.user.userId);
    
    // 移除参与者
    room.participants = room.participants.filter(p => p.user !== user.userId);
    
    // 如果房间空了，删除房间
    if (room.participants.length === 0) {
      store.removeRoom(room.id);
      return res.json({ message: '房间已删除' });
    }
    
    // 如果离开的是主持人，将权限转移给第一个管理员
    if (room.createdBy === user.userId) {
      const admin = room.participants.find(p => p.role === 'admin');
      if (admin) {
        room.createdBy = admin.user;
        admin.role = 'host';
      }
    }
    
    store.updateRoom(room);
    res.json({ message: '已离开房间' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 更新参与者角色
async function updateParticipantRole(req, res) {
  try {
    const { userId, role } = req.body;
    
    const room = store.findRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }
    
    // 检查权限
    const user = store.findUserById(req.user.userId);
    if (!room.participants.some(p => p.user === user.userId && p.role === 'admin')) {
      return res.status(403).json({ error: '没有权限修改角色' });
    }
    
    const participant = room.participants.find(p => p.user === userId);
    
    if (!participant) {
      return res.status(404).json({ error: '参与者不存在' });
    }
    
    participant.role = role;
    store.updateRoom(room);
    
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 开始日程
async function startSchedule(req, res) {
  try {
    const room = store.findRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }
    
    // 检查权限
    const user = store.findUserById(req.user.userId);
    if (!room.participants.some(p => p.user === user.userId && p.role === 'admin')) {
      return res.status(403).json({ error: '没有权限开始日程' });
    }
    
    if (room.schedule.length === 0) {
      return res.status(400).json({ error: '没有设置日程' });
    }
    
    room.status = 'in_progress';
    room.currentScheduleIndex = 0;
    store.updateRoom(room);
    
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 暂停日程
async function pauseSchedule(req, res) {
  try {
    const room = store.findRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }
    
    // 检查权限
    const user = store.findUserById(req.user.userId);
    if (!room.participants.some(p => p.user === user.userId && p.role === 'admin')) {
      return res.status(403).json({ error: '没有权限暂停日程' });
    }
    
    room.status = 'paused';
    store.updateRoom(room);
    
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 继续日程
async function resumeSchedule(req, res) {
  try {
    const room = store.findRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }
    
    // 检查权限
    const user = store.findUserById(req.user.userId);
    if (!room.participants.some(p => p.user === user.userId && p.role === 'admin')) {
      return res.status(403).json({ error: '没有权限继续日程' });
    }
    
    room.status = 'in_progress';
    store.updateRoom(room);
    
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 完成当前日程项
async function completeCurrentScheduleItem(req, res) {
  try {
    const room = store.findRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }
    
    // 检查权限
    const user = store.findUserById(req.user.userId);
    if (!room.participants.some(p => p.user === user.userId && p.role === 'admin')) {
      return res.status(403).json({ error: '没有权限完成日程项' });
    }
    
    if (room.currentScheduleIndex >= 0 && room.currentScheduleIndex < room.schedule.length) {
      room.schedule[room.currentScheduleIndex].completed = true;
      room.currentScheduleIndex++;
    }
    
    store.updateRoom(room);
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 获取消息列表
async function getMessages(req, res) {
  try {
    const room = store.findRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }
    
    // 检查权限
    const user = store.findUserById(req.user.userId);
    if (!room.participants.some(p => p.user === user.userId)) {
      return res.status(403).json({ error: '没有权限查看消息' });
    }
    
    const messages = store.getMessages(room.id);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 发送消息
async function sendMessage(req, res) {
  try {
    const { content } = req.body;
    
    const room = store.findRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }
    
    // 检查权限
    const user = store.findUserById(req.user.userId);
    if (!room.participants.some(p => p.user === user.userId)) {
      return res.status(403).json({ error: '没有权限发送消息' });
    }
    
    const message = {
      id: String(Date.now()),
      room: room.id,
      sender: user.userId,
      content,
      timestamp: new Date().toISOString(),
      edited: false,
      deleted: false
    };
    
    store.addMessage(message);
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 编辑消息
async function editMessage(req, res) {
  try {
    const { content } = req.body;
    
    const room = store.findRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }
    
    const message = store.findMessageById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ error: '消息不存在' });
    }
    
    // 检查权限
    const user = store.findUserById(req.user.userId);
    if (message.sender !== user.userId && 
        !room.participants.some(p => p.user === user.userId && p.role === 'admin')) {
      return res.status(403).json({ error: '没有权限编辑消息' });
    }
    
    // 检查房间设置
    if (!room.settings.allowMessageEdit) {
      return res.status(403).json({ error: '房间不允许编辑消息' });
    }
    
    message.content = content;
    message.edited = true;
    store.updateMessage(message);
    
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 删除消息
async function deleteMessage(req, res) {
  try {
    const room = store.findRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }
    
    const message = store.findMessageById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ error: '消息不存在' });
    }
    
    // 检查权限
    const user = store.findUserById(req.user.userId);
    if (message.sender !== user.userId && 
        !room.participants.some(p => p.user === user.userId && p.role === 'admin')) {
      return res.status(403).json({ error: '没有权限删除消息' });
    }
    
    // 检查房间设置
    if (!room.settings.allowMessageDelete) {
      return res.status(403).json({ error: '房间不允许删除消息' });
    }
    
    store.removeMessage(message.id);
    res.json({ message: '消息已删除' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 计时器控制
async function startTimer(req, res) {
  try {
    const roomId = req.params.id;
    const { duration } = req.body;
    const user = store.findUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const room = store.findRoomById(roomId);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }

    // 检查权限
    if (!['host', 'admin', 'sys'].includes(user.role)) {
      return res.status(403).json({ error: '没有权限控制计时器' });
    }

    const timer = store.startTimer(roomId, duration);
    res.json(timer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function pauseTimer(req, res) {
  try {
    const roomId = req.params.id;
    const user = store.findUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const room = store.findRoomById(roomId);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }

    // 检查权限
    if (!['host', 'admin', 'sys'].includes(user.role)) {
      return res.status(403).json({ error: '没有权限控制计时器' });
    }

    const timer = store.pauseTimer(roomId);
    res.json(timer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function resumeTimer(req, res) {
  try {
    const roomId = req.params.id;
    const user = store.findUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const room = store.findRoomById(roomId);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }

    // 检查权限
    if (!['host', 'admin', 'sys'].includes(user.role)) {
      return res.status(403).json({ error: '没有权限控制计时器' });
    }

    const timer = store.resumeTimer(roomId);
    res.json(timer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getTimerStatus(req, res) {
  try {
    const roomId = req.params.id;
    const timer = store.getTimerStatus(roomId);
    res.json(timer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// 日程管理
async function updateSchedule(req, res) {
  try {
    const roomId = req.params.id;
    const { schedule } = req.body;
    const user = store.findUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const room = store.findRoomById(roomId);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }

    // 检查权限
    if (room.createdBy !== user.userId && !['admin', 'sys'].includes(user.role)) {
      return res.status(403).json({ error: '没有权限修改日程' });
    }

    const updatedSchedule = store.updateSchedule(roomId, schedule);
    res.json(updatedSchedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getSchedule(req, res) {
  try {
    const roomId = req.params.id;
    const schedule = store.getSchedule(roomId);
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// 开始日程序列
async function startScheduleItem(req, res) {
  try {
    const roomId = req.params.id;
    const { scheduleIndex } = req.body;
    const user = store.findUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const room = store.findRoomById(roomId);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }

    // 检查权限
    if (!['host', 'admin', 'sys'].includes(user.role)) {
      return res.status(403).json({ error: '没有权限控制日程' });
    }
    
    // 检查日程是否存在
    if (!room.schedule || room.schedule.length === 0) {
      return res.status(400).json({ error: '房间没有日程安排' });
    }
    
    const index = scheduleIndex !== undefined ? scheduleIndex : 0;
    if (index < 0 || index >= room.schedule.length) {
      return res.status(400).json({ error: '无效的日程索引' });
    }
    
    // 更新房间状态
    room.status = 'in_progress';
    room.currentScheduleIndex = index;
    room.scheduleStartTime = Date.now();
    room.scheduleRemainingTime = room.schedule[index].duration;
    
    const updatedRoom = store.updateRoom(room);
    
    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// 暂停日程
async function pauseScheduleItem(req, res) {
  try {
    const roomId = req.params.id;
    const user = store.findUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const room = store.findRoomById(roomId);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }

    // 检查权限
    if (!['host', 'admin', 'sys'].includes(user.role)) {
      return res.status(403).json({ error: '没有权限控制日程' });
    }
    
    // 检查是否有正在进行的日程
    if (room.status !== 'in_progress' || room.currentScheduleIndex === undefined) {
      return res.status(400).json({ error: '没有正在进行的日程' });
    }
    
    // 计算剩余时间
    const elapsedTime = (Date.now() - room.scheduleStartTime) / 1000;
    room.scheduleRemainingTime = Math.max(0, room.schedule[room.currentScheduleIndex].duration - elapsedTime);
    
    // 更新房间状态
    room.status = 'paused';
    
    const updatedRoom = store.updateRoom(room);
    
    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// 继续日程
async function resumeScheduleItem(req, res) {
  try {
    const roomId = req.params.id;
    const user = store.findUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const room = store.findRoomById(roomId);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }

    // 检查权限
    if (!['host', 'admin', 'sys'].includes(user.role)) {
      return res.status(403).json({ error: '没有权限控制日程' });
    }
    
    // 检查是否有已暂停的日程
    if (room.status !== 'paused' || room.currentScheduleIndex === undefined) {
      return res.status(400).json({ error: '没有已暂停的日程' });
    }
    
    // 更新开始时间
    room.scheduleStartTime = Date.now();
    room.status = 'in_progress';
    
    const updatedRoom = store.updateRoom(room);
    
    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// 下一个日程
async function nextScheduleItem(req, res) {
  try {
    const roomId = req.params.id;
    const user = store.findUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const room = store.findRoomById(roomId);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }

    // 检查权限
    if (!['host', 'admin', 'sys'].includes(user.role)) {
      return res.status(403).json({ error: '没有权限控制日程' });
    }
    
    // 检查日程是否存在
    if (!room.schedule || room.schedule.length === 0) {
      return res.status(400).json({ error: '房间没有日程安排' });
    }
    
    // 当前日程标记为已完成
    if (room.currentScheduleIndex !== undefined) {
      room.schedule[room.currentScheduleIndex].completed = true;
    }
    
    // 移动到下一个日程
    const nextIndex = (room.currentScheduleIndex || 0) + 1;
    
    if (nextIndex >= room.schedule.length) {
      room.status = 'completed';
      room.currentScheduleIndex = undefined;
    } else {
      room.status = 'in_progress';
      room.currentScheduleIndex = nextIndex;
      room.scheduleStartTime = Date.now();
      room.scheduleRemainingTime = room.schedule[nextIndex].duration;
    }
    
    const updatedRoom = store.updateRoom(room);
    
    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getRooms,
  createRoom,
  getRoom,
  joinRoom,
  deleteRoom,
  updateRoom,
  joinRoomByInviteCode,
  leaveRoom,
  updateParticipantRole,
  startSchedule,
  pauseSchedule,
  resumeSchedule,
  completeCurrentScheduleItem,
  getMessages,
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
  nextScheduleItem
}; 