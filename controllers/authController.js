"use strict";
const bcrypt = require('bcryptjs');
const store = require('../data/store');
const { generateToken } = require('../middleware/auth');

// 注册
async function register(req, res) {
  try {
    const { username, password, role } = req.body;

    // 验证必填字段
    if (!username || !password || !role) {
      return res.status(400).json({ error: '用户名、密码和角色都是必填项' });
    }

    // 验证角色是否合法
    const validRoles = ['student', 'host', 'admin', 'observer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: '无效的角色' });
    }

    // 检查用户名是否已存在
    const existingUser = store.findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    // 创建新用户
    const passwordHash = await bcrypt.hash(password, 10);
    const user = store.addUser({
      username,
      passwordHash,
      role
    });

    // 生成 token
    const token = generateToken(user);

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        userId: user.userId,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 登录
async function login(req, res) {
  try {
    const { username, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码都是必填项' });
    }

    // 查找用户
    const user = store.findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 生成 token
    const token = generateToken(user);

    res.json({
      message: '登录成功',
      token,
      user: {
        userId: user.userId,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  register,
  login
}; 