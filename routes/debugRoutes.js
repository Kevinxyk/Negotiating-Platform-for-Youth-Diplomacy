const express = require('express');
const jwt = require('jsonwebtoken');
const AvatarService = require('../services/avatarService');
const userProfileService = require('../services/userProfileService');
const store = require('../data/store');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const router = express.Router();

// 认证中间件，只允许admin/sys
function requireAdminOrSys(req, res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.replace(/^Bearer\s+/, '');
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role === 'admin' || decoded.role === 'sys') {
            req.user = decoded;
            return next();
        }
        return res.status(403).json({ error: '无权限' });
    } catch (e) {
        return res.status(401).json({ error: '认证失败' });
    }
}

// 查询在线用户
router.get('/online-users', requireAdminOrSys, (req, res) => {
    const onlineUsers = global.onlineUsers ? Array.from(global.onlineUsers.values()) : [];
    res.json({ success: true, data: onlineUsers });
});

// 查询房间
router.get('/rooms', requireAdminOrSys, (req, res) => {
    const rooms = store.rooms || [];
    res.json({ success: true, data: rooms });
});

// token解码
router.post('/decode-token', requireAdminOrSys, (req, res) => {
    const { token } = req.body;
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ success: true, data: decoded });
    } catch (e) {
        res.status(400).json({ success: false, error: 'token无效' });
    }
});

module.exports = router; 