const store = require('../data/store');
const userService = require('../services/userService');

// 获取系统概览
async function getSystemOverview(req, res) {
  const users = store.users || [];
  const rooms = store.rooms || [];
  const messages = store.messages || [];
  
  const overview = {
    users: {
      total: users.length,
      online: 0, // 这个需要从WebSocket连接中获取
      active: users.filter(u => u.lastLogin && 
        new Date(u.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
    },
    rooms: {
      total: rooms.length,
      active: rooms.filter(r => r.status === 'active').length,
      inactive: rooms.filter(r => r.status === 'inactive').length
    },
    messages: {
      total: messages.length,
      today: messages.filter(m => 
        new Date(m.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
      thisWeek: messages.filter(m => 
        new Date(m.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
    },
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      platform: process.platform
    }
  };
  
  res.json({ status: 'ok', overview });
}

// 获取用户列表
async function getUserList(req, res) {
  const { page = 1, limit = 20, search = '', role = '' } = req.query;
  
  let users = store.users || [];
  
  // 搜索过滤
  if (search) {
    users = users.filter(user => 
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  // 角色过滤
  if (role) {
    users = users.filter(user => user.role === role);
  }
  
  // 分页
  const total = users.length;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  users = users.slice(offset, offset + parseInt(limit));
  
  res.json({
    status: 'ok',
    users,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}

// 更新用户信息
async function updateUser(req, res) {
  const { userId } = req.params;
  const { username, email, role, status } = req.body;
  
  const user = store.users.find(u => u.userId === userId);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  
  // 更新用户信息
  if (username) user.username = username;
  if (email) user.email = email;
  if (role) user.role = role;
  if (status !== undefined) user.status = status;
  
  user.updatedAt = new Date().toISOString();
  
  res.json({ status: 'ok', user });
}

// 删除用户
async function deleteUser(req, res) {
  const { userId } = req.params;
  
  const userIndex = store.users.findIndex(u => u.userId === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: '用户不存在' });
  }
  
  // 不能删除自己
  if (userId === req.user.userId) {
    return res.status(400).json({ error: '不能删除自己的账户' });
  }
  
  store.users.splice(userIndex, 1);
  
  res.json({ status: 'ok', message: '用户已删除' });
}

// 获取房间列表
async function getRoomList(req, res) {
  const { page = 1, limit = 20, status = '' } = req.query;
  
  let rooms = store.rooms || [];
  
  // 状态过滤
  if (status) {
    rooms = rooms.filter(room => room.status === status);
  }
  
  // 分页
  const total = rooms.length;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  rooms = rooms.slice(offset, offset + parseInt(limit));
  
  res.json({
    status: 'ok',
    rooms,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}

// 更新房间状态
async function updateRoom(req, res) {
  const { roomId } = req.params;
  const { status, maxParticipants, description } = req.body;
  
  const room = store.rooms.find(r => r.id === roomId);
  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }
  
  // 更新房间信息
  if (status) room.status = status;
  if (maxParticipants) room.maxParticipants = maxParticipants;
  if (description) room.description = description;
  
  room.updatedAt = new Date().toISOString();
  
  res.json({ status: 'ok', room });
}

// 删除房间
async function deleteRoom(req, res) {
  const { roomId } = req.params;
  
  const roomIndex = store.rooms.findIndex(r => r.id === roomId);
  if (roomIndex === -1) {
    return res.status(404).json({ error: '房间不存在' });
  }
  
  store.rooms.splice(roomIndex, 1);
  
  res.json({ status: 'ok', message: '房间已删除' });
}

// 获取系统日志
async function getSystemLogs(req, res) {
  const { type = '', startDate, endDate, limit = 100 } = req.query;
  
  const logs = store.getSystemLogs(type, startDate, endDate, parseInt(limit));
  
  res.json({ status: 'ok', logs });
}

// 记录系统日志
function logSystemAction(logEntry) {
  store.addSystemLog(logEntry);
}

// 获取文件管理信息
async function getFileManagement(req, res) {
  const images = store.images || [];
  const voiceMessages = store.voiceMessages || [];
  
  const fileInfo = {
    images: {
      total: images.length,
      totalSize: images.reduce((sum, img) => sum + (img.size || 0), 0),
      recent: images.slice(-10) // 最近10个
    },
    voice: {
      total: voiceMessages.length,
      totalSize: voiceMessages.reduce((sum, voice) => sum + (voice.size || 0), 0),
      recent: voiceMessages.slice(-10) // 最近10个
    }
  };
  
  res.json({ status: 'ok', fileInfo });
}

// 清理过期文件
async function cleanupFiles(req, res) {
  const { days = 30 } = req.query;
  const cutoffDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
  
  let cleanedCount = 0;
  
  // 清理图片
  if (store.images) {
    const originalLength = store.images.length;
    store.images = store.images.filter(img => 
      new Date(img.uploadTime) > cutoffDate
    );
    cleanedCount += originalLength - store.images.length;
  }
  
  // 清理语音消息
  if (store.voiceMessages) {
    const originalLength = store.voiceMessages.length;
    store.voiceMessages = store.voiceMessages.filter(voice => 
      new Date(voice.uploadTime) > cutoffDate
    );
    cleanedCount += originalLength - store.voiceMessages.length;
  }
  
  res.json({ 
    status: 'ok', 
    message: `已清理 ${cleanedCount} 个过期文件`,
    cleanedCount 
  });
}

module.exports = {
  getSystemOverview,
  getUserList,
  updateUser,
  deleteUser,
  getRoomList,
  updateRoom,
  deleteRoom,
  getSystemLogs,
  logSystemAction,
  getFileManagement,
  cleanupFiles
}; 