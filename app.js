"use strict";
const express = require('express');
const cors = require('cors');
const routes = require('./routes/index');
const bodyParser = require("body-parser");
const path = require("path");
const http = require('http');
const WebSocket = require('ws');
const mysqlService = require('./services/mysqlService');

const app = express();
const server = http.createServer(app);

// 配置WebSocket服务器
const wss = new WebSocket.Server({ 
  server,
  clientTracking: true,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024
  },
  maxPayload: 50 * 1024 * 1024, // 50MB
  heartbeatInterval: 30000
});

// 内存存储
const rooms = new Map();
const messages = new Map();
const privateMessages = new Map();
const speakingOrder = new Map();
const timers = new Map();

// 存储在线用户和聊天记录
const onlineUsers = new Map(); // userId -> userInfo
const chatHistory = {
    group: [], // 群聊历史
    private: new Map() // userId -> [messages]
};

// 心跳检测
function heartbeat() {
  this.isAlive = true;
  this.lastPing = Date.now();
}

// WebSocket连接处理
wss.on('connection', (ws, req) => {
  const userId = generateUserId();
  let userInfo = null;
  
  // 心跳检测
  ws.isAlive = true;
  ws.on('pong', heartbeat);
  
  // 消息处理
  ws.on('message', (message, isBinary) => {
    // 如果是二进制数据，则当作音频帧转发给同房间的其他客户端
    if (isBinary) {
      if (userInfo && userInfo.room && rooms.has(userInfo.room)) {
        rooms.get(userInfo.room).forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message, { binary: true });
          }
        });
      }
      return;
    }
    try {
      const data = JSON.parse(message);
      console.log('Received message:', data); // 添加日志
      
      switch (data.type) {
        case 'join':
          // 用户加入房间
          const roomId = data.room;
          if (!rooms.has(roomId)) rooms.set(roomId, new Set());
          rooms.get(roomId).add(ws);
          userInfo = {
            id: userId,
            name: data.name,
            role: data.role,
            country: data.country,
            ws: ws,
            room: roomId
          };
          onlineUsers.set(userId, userInfo);
          
          // 广播用户列表更新
          broadcastUserList();
          
          // 发送欢迎消息
          ws.send(JSON.stringify({
            type: 'system',
            message: '欢迎加入聊天室！'
          }));
          break;
          
        case 'chat':
          // 群聊消息
          if (!userInfo) {
            ws.send(JSON.stringify({
              type: 'error',
              message: '请先加入聊天室'
            }));
            return;
          }
          
          const groupMessage = {
            type: 'chat',
            from: userId,
            fromName: userInfo.name,
            content: data.content,
            timestamp: new Date().toISOString()
          };
          
          // 保存到历史记录
          chatHistory.group.push(groupMessage);
          if (chatHistory.group.length > 100) {
            chatHistory.group.shift();
          }
          
          // 广播消息
          broadcastMessage(groupMessage);
          break;
          
        case 'private':
          // 私聊消息
          if (!userInfo) {
            ws.send(JSON.stringify({
              type: 'error',
              message: '请先加入聊天室'
            }));
            return;
          }
          
          const targetUser = onlineUsers.get(data.to);
          if (targetUser) {
            const privateMessage = {
              type: 'private',
              from: userId,
              fromName: userInfo.name,
              to: data.to,
              content: data.content,
              timestamp: new Date().toISOString()
            };
            
            // 保存到历史记录
            if (!chatHistory.private.has(userId)) {
              chatHistory.private.set(userId, new Map());
            }
            if (!chatHistory.private.has(data.to)) {
              chatHistory.private.set(data.to, new Map());
            }
            
            const userHistory = chatHistory.private.get(userId);
            const targetHistory = chatHistory.private.get(data.to);
            
            if (!userHistory.has(data.to)) {
              userHistory.set(data.to, []);
            }
            if (!targetHistory.has(userId)) {
              targetHistory.set(userId, []);
            }
            
            userHistory.get(data.to).push(privateMessage);
            targetHistory.get(userId).push(privateMessage);
            
            // 发送给目标用户
            targetUser.ws.send(JSON.stringify(privateMessage));
            // 发送给发送者
            ws.send(JSON.stringify(privateMessage));
          }
          break;
          
        case 'getHistory':
          // 获取历史消息
          if (data.mode === 'group') {
            ws.send(JSON.stringify({
              type: 'history',
              mode: 'group',
              messages: chatHistory.group
            }));
          } else if (data.mode === 'private' && data.targetUser) {
            const targetUser = Array.from(onlineUsers.values())
              .find(u => u.name === data.targetUser);
              
            if (targetUser) {
              const userHistory = chatHistory.private.get(userId);
              if (userHistory && userHistory.has(targetUser.id)) {
                ws.send(JSON.stringify({
                  type: 'history',
                  mode: 'private',
                  messages: userHistory.get(targetUser.id)
                }));
              }
            }
          }
          break;
          
        case 'raiseHand':
          // 用户举手，通知房间中所有主持人/管理员
          if (userInfo && userInfo.room) {
            onlineUsers.forEach(info => {
              if (info.room === userInfo.room && ['host','admin','sys'].includes(info.role)) {
                info.ws.send(JSON.stringify({
                  type: 'raiseHand',
                  from: userInfo.name,
                  userId: userInfo.id,
                  timestamp: new Date().toISOString()
                }));
              }
            });
          }
          break;
          
        case 'timer':
          // 处理计时器相关消息
          handleTimerMessage(data, ws);
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: '消息处理错误'
      }));
    }
  });
  
  // 连接关闭处理
  ws.on('close', () => {
    if (userInfo) {
      // 移除房间成员
      if (userInfo.room && rooms.has(userInfo.room)) {
        const set = rooms.get(userInfo.room);
        set.delete(ws);
        if (set.size === 0) rooms.delete(userInfo.room);
      }
      onlineUsers.delete(userId);
      broadcastUserList();
    }
  });
});

// 处理计时器消息
function handleTimerMessage(data, ws) {
  const key = 'main';
  let timerData = timers.get(key);
  switch (data.action) {
    case 'start': {
      // 如果不存在，则创建，否则更新，且记录初始时间
      const t = data.time || (timerData? timerData.initialTime : 300);
      if (!timerData) {
        timerData = { remainingTime: t, initialTime: t, interval: null };
        timers.set(key, timerData);
      } else {
        // 更新剩余时间与初始时间
        timerData.remainingTime = t;
        timerData.initialTime = t;
        if (timerData.interval) clearInterval(timerData.interval);
      }
      
      // 启动定时器
      timerData.interval = setInterval(() => {
        timerData.remainingTime--;
        if (timerData.remainingTime > 0) {
          broadcastMessage({ type: 'timer', time: timerData.remainingTime });
        } else {
          clearInterval(timerData.interval);
          timers.delete(key);
          broadcastMessage({ type: 'timer', time: 0 });
          // 时间到时的提示，包含时间戳
          broadcastMessage({ type: 'system', message: '时间到！', timestamp: new Date().toISOString() });
        }
      }, 1000);
      // 立即推送当前值
      broadcastMessage({ type: 'timer', time: timerData.remainingTime });
      break;
    }
    case 'pause': {
      if (timerData && timerData.interval) {
        clearInterval(timerData.interval);
        timerData.interval = null;
      }
      break;
    }
    case 'resume': {
      if (timerData && !timerData.interval && timerData.remainingTime > 0) {
        timerData.interval = setInterval(() => {
          timerData.remainingTime--;
          if (timerData.remainingTime > 0) {
            broadcastMessage({ type: 'timer', time: timerData.remainingTime });
          } else {
            clearInterval(timerData.interval);
            timers.delete(key);
            broadcastMessage({ type: 'timer', time: 0 });
            broadcastMessage({ type: 'system', message: '时间到！', timestamp: new Date().toISOString() });
          }
        }, 1000);
      }
      // 立即推送当前剩余时间
      if (timerData) {
        broadcastMessage({ type: 'timer', time: timerData.remainingTime });
      }
      break;
    }
    case 'reset': {
      // 清除定时器
      if (timerData && timerData.interval) {
        clearInterval(timerData.interval);
      }
      // 计算恢复到的时间
      const resetTime = data.time != null ? data.time : (timerData? timerData.initialTime : 300);
      timers.delete(key);
      broadcastMessage({ type: 'timer', time: resetTime });
      break;
    }
    case 'set': {
      // 清除旧定时器
      if (timerData && timerData.interval) {
        clearInterval(timerData.interval);
      }
      // 设置新时间
      timerData = { remainingTime: data.time, initialTime: data.time, interval: null };
      timers.set(key, timerData);
      broadcastMessage({ type: 'timer', time: data.time });
      break;
    }
    default:
      break;
  }
}

// 广播用户列表
function broadcastUserList() {
  const userList = Array.from(onlineUsers.values()).map(user => ({
    id: user.id,
    name: user.name,
    role: user.role,
    country: user.country
  }));
  
  const message = JSON.stringify({
    type: 'userList',
    users: userList
  });
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// 广播消息
function broadcastMessage(message) {
  const messageStr = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// 生成用户ID
function generateUserId() {
  return Math.random().toString(36).substr(2, 9);
}

// 心跳检测
const interval = setInterval(() => {
  wss.clients.forEach(ws => {
    if (ws.isAlive === false) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

app.use(cors());
app.use(bodyParser.json());

// 静态文件服务配置
app.use(express.static(path.join(__dirname, "public")));

// 前端页面路由
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});
app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});
app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

// 研讨室列表与创建页面
app.get('/rooms', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'rooms.html'));
});
app.get('/rooms/create', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'create-room.html'));
});
app.get('/rooms/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'room.html'));
});

app.use('/frontend', express.static(path.join(__dirname, "..", "frontend")));

// 在 /api 之前加一个根路由
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "API is running" });
});

app.use('/api', routes);

// 认证路由
app.use('/api/auth', require('./routes/authRoutes'));

// 研讨室管理 API
app.use('/api/rooms', require('./routes/roomRoutes'));

// 保留原 /test 路由，指向原始 API 测试页面
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

// 新增测试路由 /test-room，指向前端研讨室登录测试页面
app.get('/test-room', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test-room.html'));
});

// 404 & 错误中间件
app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
app.use(
  '/debateroom2',
  express.static(path.join(__dirname, 'frontend', 'debateroom2'))
);

const PORT = process.env.PORT || 3000;
if (process.env.USE_MYSQL === 'true') {
  mysqlService.init().catch(err => console.error('MySQL init error', err));
}
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 