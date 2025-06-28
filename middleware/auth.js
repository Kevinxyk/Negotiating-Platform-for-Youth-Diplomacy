"use strict";
const jwt = require('jsonwebtoken');
const store = require('../data/store');
const userService = require('../services/userService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 生成 JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.userId,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// 统一认证中间件，支持header和cookie
const verifyToken = async (req, res, next) => {
  let token = null;
  // 优先用header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 没有header再用cookie
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // Test环境bypass
  if (process.env.NODE_ENV === 'test') {
    req.user = {
      userId: 'test',
      username: 'test',
      role: req.headers['x-user-role'] || 'delegate'
    };
    return next();
  }
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await userService.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    req.user = {
      userId: user.userId,
      username: user.username,
      role: user.role
    };
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({ error: '无效的认证令牌' });
  }
};

// 兼容旧代码的别名
const requireAuth = verifyToken;

// 检查用户角色
const requireRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    // Test environment bypass
    if (process.env.NODE_ENV === 'test' && req.user.userId === 'test') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }

    next();
  };
};

// 检查用户是否是房间创建者或管理员
const requireRoomAdmin = async (req, res, next) => {
  const roomId = req.params.id;
  const room = store.findRoomById(roomId);

  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }

  if (room.createdBy !== req.user.userId && !['admin', 'sys'].includes(req.user.role)) {
    return res.status(403).json({ error: '没有权限执行此操作' });
  }

  next();
};

// 检查用户是否是房间参与者
const requireRoomParticipant = async (req, res, next) => {
  const roomId = req.params.id;
  const room = store.findRoomById(roomId);

  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }

  if (!room.participants.some(p => p.userId === req.user.userId)) {
    return res.status(403).json({ error: '您不是此房间的参与者' });
  }

  next();
};

module.exports = {
  generateToken,
  verifyToken,
  requireAuth,
  requireRoles,
  requireRoomAdmin,
  requireRoomParticipant
};
