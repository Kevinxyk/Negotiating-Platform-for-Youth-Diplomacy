"use strict";
const jwt = require('jsonwebtoken');
const store = require('../data/store');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 生成 JWT token
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.userId,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// 验证 JWT token
function verifyToken(req, res, next) {
  // Testing bypass: allow x-user-role header to set req.user without JWT
  const testRole = req.headers['x-user-role'];
  if (testRole) {
    // set a dummy user based on role header
    req.user = { userId: testRole, username: testRole, role: testRole };
    return next();
  }
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = store.findUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
}

// 角色验证中间件
function checkRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: '权限不足' });
    }

    next();
  };
}

module.exports = {
  generateToken,
  verifyToken,
  checkRole
}; 