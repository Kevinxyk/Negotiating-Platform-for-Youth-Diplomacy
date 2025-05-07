"use strict";
const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');

// 注册路由
router.post('/register', register);

// 登录路由
router.post('/login', login);

// 忘记密码路由
router.post('/forgot-password', forgotPassword);

// 重置密码路由
router.post('/reset-password', resetPassword);

module.exports = router; 