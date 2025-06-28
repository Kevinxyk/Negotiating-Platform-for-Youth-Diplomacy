"use strict";
const bcrypt = require('bcryptjs');
const userService = require('../services/userService');
const { generateToken } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 注册
async function register(req, res) {
  try {
    const { username, password, role } = req.body;

    // 验证必填字段
    if (!username || !password || !role) {
      return res.status(400).json({ error: '用户名、密码和角色都是必填项' });
    }

    // 验证角色是否合法
    const validRoles = ['student', 'host', 'admin', 'observer', 'sys', 'judge', 'delegate'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: '无效的角色' });
    }

    // 检查用户名是否已存在
    const existingUser = await userService.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    // 创建新用户
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userService.addUser({
      username,
      passwordHash,
      role
    });

    // 生成 token
    const token = jwt.sign({ userId: user.userId, role: user.role }, JWT_SECRET, { expiresIn: '2h' });

    // 注册成功后同样写cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000
    });

    res.status(201).json({
      message: '注册成功',
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
    const user = await userService.findByUsername(username);
    if (!user || !userService.verifyPassword(user, password)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 生成 token
    const token = jwt.sign({ userId: user.userId, role: user.role }, JWT_SECRET, { expiresIn: '2h' });

    // 登录成功后用Set-Cookie写入token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000
    });

    res.json({
      message: '登录成功',
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

// 忘记密码：发送重置链接
async function forgotPassword(req, res) {
  try {
    const { username } = req.body;
    const user = await userService.findByUsername(username);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    // 生成重置 token，有效期 1 小时
    const resetToken = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '1h' });
    // TODO: 发送邮件，包含重置链接
    console.log(`Password reset link: http://<你的域名>/reset-password?token=${resetToken}`);
    res.json({ message: '重置密码邮件已发送，请检查邮箱' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 重置密码：提交新密码
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await userService.findById(payload.userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    res.json({ message: '密码已重置，请使用新密码登录' });
  } catch (err) {
    res.status(400).json({ error: '无效或过期的重置令牌' });
  }
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword
}; 