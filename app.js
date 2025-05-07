"use strict";
const express = require('express');
const cors = require('cors');
const routes = require('./routes/index');
const bodyParser = require("body-parser");
const path = require("path");
const http = require('http');
const WebSocket = require('ws');

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
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message:', data); // 添加日志
      
      switch (data.type) {
        case 'join':
          // 用户加入
          userInfo = {
            id: userId,
            name: data.name,
            role: data.role,
            country: data.country,
            ws: ws
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
      onlineUsers.delete(userId);
      broadcastUserList();
    }
  });
});

// 处理计时器消息
function handleTimerMessage(data, ws) {
  switch (data.action) {
    case 'start':
      // 启动计时器
      if (!timers.has('main')) {
        const timer = {
          remainingTime: data.time || 300,
          interval: setInterval(() => {
            const timerData = timers.get('main');
            if (timerData.remainingTime > 0) {
              timerData.remainingTime--;
              broadcastMessage({
                type: 'timer',
                time: timerData.remainingTime
              });
            } else {
              clearInterval(timerData.interval);
              timers.delete('main');
              // 时间到时的提示
              broadcastMessage({
                type: 'system',
                message: '时间到！'
              });
            }
          }, 1000)
        };
        timers.set('main', timer);
      }
      break;
      
    case 'pause':
      // 暂停计时器
      const timer = timers.get('main');
      if (timer) {
        clearInterval(timer.interval);
        timers.delete('main');
      }
      break;
      
    case 'reset':
      // 重置计时器
      const existingTimer = timers.get('main');
      if (existingTimer) {
        clearInterval(existingTimer.interval);
      }
      timers.delete('main');
      broadcastMessage({
        type: 'timer',
        time: 300 // 默认5分钟
      });
      break;
      
    case 'set':
      // 设置计时器时间
      const currentTimer = timers.get('main');
      if (currentTimer) {
        clearInterval(currentTimer.interval);
      }
      timers.delete('main');
      broadcastMessage({
        type: 'timer',
        time: data.time
      });
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
app.use('/frontend', express.static(path.join(__dirname, "..", "frontend")));

// 在 /api 之前加一个根路由
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "API is running" });
});

app.use('/api', routes);

// 认证路由
app.use('/api/auth', require('./routes/authRoutes'));

// 404 & 错误中间件
app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 