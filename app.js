"use strict";
const express = require('express');
const cors = require('cors');
const routes = require('./routes/index');
const path = require("path");
const http = require('http');
const WebSocket = require('ws');
const mysqlService = require('./services/mysqlService');
const { v4: uuidv4 } = require('uuid');
const store = require('./data/store');
const jwt = require('jsonwebtoken');
const userService = require('./services/userService');
const { processEmojiMessage } = require('./controllers/emojiController');
const AvatarService = require('./services/avatarService');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const persistence = require('./data/persistence');

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
global.onlineUsers = onlineUsers; // 暴露为全局变量
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
  
  // 连接建立处理
  ws.on('open', () => {
    console.log('🔗 New WebSocket connection established');
  });
  
  // 消息处理
  ws.on('message', async (data, isBinary) => {
    // 如果是二进制数据，则当作音频帧转发给同房间的其他客户端
    if (isBinary) {
      if (userInfo && userInfo.room && rooms.has(userInfo.room)) {
        rooms.get(userInfo.room).forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(data, { binary: true });
          }
        });
      }
      return;
    }
    
    try {
      const message = JSON.parse(data);
      console.log('📨 Received message:', {
        type: message.type,
        from: message.username || 'unknown',
        content: message.content ? message.content.substring(0, 50) + '...' : 'no content'
      });
      
      // 心跳检测
      if (message.type === 'ping') {
        return;
      }
      
      switch (message.type) {
        case 'join':
          try {
            const decoded = jwt.verify(message.token || '', JWT_SECRET);
            const user = await userService.findById(decoded.userId);
            if (!user) {
              ws.send(JSON.stringify({ type: 'error', message: '用户不存在' }));
              return;
            }

            const roomId = message.room;
            if (!roomId || typeof roomId !== 'string') {
              ws.send(JSON.stringify({ type: 'error', message: '无效的房间ID' }));
              return;
            }
            
            if (!rooms.has(roomId)) rooms.set(roomId, new Set());
            rooms.get(roomId).add(ws);
            userInfo = {
              id: userId,
              name: user.username,
              role: user.role,
              country: message.country,
              ws: ws,
              room: roomId,
              canSpeak: true,
              isSpeaking: false,
              isRaisingHand: false,
              lastSpeakTime: null,
              speakTimeLimit: null,
              score: 0,
              joinTime: new Date().toISOString()
            };
            onlineUsers.set(userId, userInfo);

            broadcastUserList();

            // Send current timer state if available
            const currentTimer = timers.get('main');
            if (currentTimer && currentTimer.remainingTime !== undefined) {
              ws.send(JSON.stringify({ type: 'timer', time: currentTimer.remainingTime }));
            }
            
            // Send chat history to the new user
            const roomMessages = store.getMessages(roomId);
            if (roomMessages && roomMessages.length > 0) {
              ws.send(JSON.stringify({
                type: 'history',
                messages: roomMessages
              }));
            }

            ws.send(JSON.stringify({
              type: 'system',
              message: '欢迎加入聊天室！'
            }));
          } catch (e) {
            console.error('Authentication error:', e);
            ws.send(JSON.stringify({ type: 'error', message: '认证失败' }));
            return;
          }
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
          
          // Validate message content
          if (!message.content || typeof message.content !== 'string' || message.content.trim().length === 0) {
            ws.send(JSON.stringify({
              type: 'error',
              message: '消息内容不能为空'
            }));
            return;
          }
          
          // 处理表情
          const processedContent = await processEmojiMessage(message.content.trim());
          
          const username = message.username || userInfo.name;
          const groupMessage = {
            type: 'chat',
            id: uuidv4(),
            from: userId,
            fromName: userInfo.name,
            username: username,
            userId: userInfo.id,
            role: userInfo.role,
            country: userInfo.country,
            content: processedContent,
            timestamp: new Date().toISOString(),
            room: userInfo.room,
            revoked: false,
            edited: false,
            deleted: false,
            avatarUrl: AvatarService.generateRoleBasedAvatar(userInfo.name, userInfo.role, 40)
          };

          // 保存到历史记录
          chatHistory.group.push(groupMessage);
          if (chatHistory.group.length > 100) {
            chatHistory.group.shift();
          }
          store.addMessage({
            id: groupMessage.id,
            room: userInfo.room,
            sender: userId,
            username: username,
            userId: userInfo.id,
            role: userInfo.role,
            country: userInfo.country,
            content: message.content,
            text: processedContent,
            timestamp: groupMessage.timestamp,
            edited: false,
            deleted: false,
            revoked: false
          });

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
          
          // Validate message content
          if (!message.content || typeof message.content !== 'string' || message.content.trim().length === 0) {
            ws.send(JSON.stringify({
              type: 'error',
              message: '消息内容不能为空'
            }));
            return;
          }
          
          // Validate target user
          if (!message.to) {
            ws.send(JSON.stringify({
              type: 'error',
              message: '请指定接收者'
            }));
            return;
          }
          
          // 处理表情
          const processedPrivateContent = await processEmojiMessage(message.content.trim());
          
          const targetUser = onlineUsers.get(message.to);
          if (targetUser) {
            const privateUsername = message.username || userInfo.name;
            const privateMessage = {
              type: 'private',
              from: userId,
              fromName: userInfo.name,
              to: message.to,
              username: privateUsername,
              userId: userInfo.id,
              role: userInfo.role,
              country: userInfo.country,
              content: processedPrivateContent,
              text: processedPrivateContent,
              timestamp: new Date().toISOString(),
              room: userInfo.room,
              revoked: false,
              edited: false,
              deleted: false,
              avatarUrl: AvatarService.generateRoleBasedAvatar(userInfo.name, userInfo.role, 40)
            };
            
            // 保存到历史记录
            if (!chatHistory.private.has(userId)) {
              chatHistory.private.set(userId, new Map());
            }
            if (!chatHistory.private.has(message.to)) {
              chatHistory.private.set(message.to, new Map());
            }
            
            const userHistory = chatHistory.private.get(userId);
            const targetHistory = chatHistory.private.get(message.to);
            
            if (!userHistory.has(message.to)) {
              userHistory.set(message.to, []);
            }
            if (!targetHistory.has(userId)) {
              targetHistory.set(userId, []);
            }
            
            userHistory.get(message.to).push(privateMessage);
            targetHistory.get(userId).push(privateMessage);
            
            // 发送给目标用户
            targetUser.ws.send(JSON.stringify(privateMessage));
            // 发送给发送者
            ws.send(JSON.stringify(privateMessage));
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              message: '目标用户不在线或不存在'
            }));
          }
          break;
          
        case 'getHistory':
          // 获取历史消息
          if (message.mode === 'group') {
            const history = store.getMessages(userInfo ? userInfo.room : '');
            ws.send(JSON.stringify({
              type: 'history',
              mode: 'group',
              messages: history
            }));
          } else if (message.mode === 'private' && message.targetUser) {
            const targetUser = Array.from(onlineUsers.values())
              .find(u => u.name === message.targetUser);
              
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
          if (userInfo && userInfo.room) {
            // 根据客户端发送的状态更新用户的举手状态
            userInfo.isRaisingHand = !!message.isRaising;
            
            // 广播一个内容清晰的系统通知
            const actionText = userInfo.isRaisingHand ? '举起了手' : '放下了手';
            broadcastMessage({
              type: 'system',
              message: `${userInfo.name} ${actionText}`,
              timestamp: new Date().toISOString()
            });
            
            // 广播更新后的用户列表，让所有客户端UI同步
            broadcastUserList();
          }
          break;
          
        case 'timer':
          // 处理计时器相关消息
          handleTimerMessage(message, ws);
          break;
          
        case 'revokeMessage':
          // 处理消息撤回
          if (!userInfo) {
            ws.send(JSON.stringify({
              type: 'error',
              message: '请先加入聊天室'
            }));
            return;
          }
          
          if (!message.messageId) {
            ws.send(JSON.stringify({
              type: 'error',
              message: '请指定要撤回的消息ID'
            }));
            return;
          }
          
          // 查找消息
          const targetMessage = store.findMessageById(message.messageId);
          if (!targetMessage) {
            ws.send(JSON.stringify({
              type: 'error',
              message: '消息不存在'
            }));
            return;
          }
          
          // 检查权限：消息作者或管理员角色可以撤回
          const isAuthor = targetMessage.username === userInfo.name;
          const isAdmin = ['admin', 'sys', 'host'].includes(userInfo.role);
          
          if (!isAuthor && !isAdmin) {
            ws.send(JSON.stringify({
              type: 'error',
              message: '没有权限撤回此消息'
            }));
            return;
          }
          
          // 撤回消息
          targetMessage.revoked = true;
          targetMessage.revokeTime = new Date().toISOString();
          targetMessage.revokedBy = userInfo.name;
          
          // 广播撤回状态
          broadcastMessage({
            type: 'messageRevoked',
            messageId: message.messageId,
            revokedBy: userInfo.name,
            timestamp: new Date().toISOString()
          });
          
          // 发送成功响应
          ws.send(JSON.stringify({
            type: 'messageRevoked',
            messageId: message.messageId,
            success: true
          }));
          break;
          
        case 'updateUserStatus':
          // 更新用户状态（权限用户操作）
          if (!userInfo) {
            ws.send(JSON.stringify({
              type: 'error',
              message: '请先加入聊天室'
            }));
            return;
          }
          
          // 检查权限
          if (!['host', 'judge', 'admin', 'sys'].includes(userInfo.role)) {
            ws.send(JSON.stringify({
              type: 'error',
              message: '没有权限执行此操作'
            }));
            return;
          }
          
          if (!message.targetUserId || !message.action) {
            ws.send(JSON.stringify({
              type: 'error',
              message: '参数不完整'
            }));
            return;
          }
          
          const targetUserForStatus = onlineUsers.get(message.targetUserId);
          if (!targetUserForStatus) {
            ws.send(JSON.stringify({
              type: 'error',
              message: '目标用户不存在'
            }));
            return;
          }
          
          // 执行操作
          switch (message.action) {
            case 'toggleSpeak':
              targetUserForStatus.canSpeak = !targetUserForStatus.canSpeak;
              break;
            case 'setSpeaking':
              targetUserForStatus.isSpeaking = message.isSpeaking || false;
              if (targetUserForStatus.isSpeaking) {
                targetUserForStatus.lastSpeakTime = new Date().toISOString();
              }
              break;
            case 'setRaisingHand':
              targetUserForStatus.isRaisingHand = message.isRaisingHand || false;
              break;
            case 'setSpeakTimeLimit':
              targetUserForStatus.speakTimeLimit = message.timeLimit || null;
              break;
            case 'setScore':
              if (['judge', 'admin', 'sys', 'observer'].includes(userInfo.role)) {
                targetUserForStatus.score = message.score || 0;
              }
              break;
            default:
              ws.send(JSON.stringify({
                type: 'error',
                message: '未知操作'
              }));
              return;
          }
          
          // 广播用户列表更新
          broadcastUserList();
          
          // 发送成功响应
          ws.send(JSON.stringify({
            type: 'userStatusUpdated',
            targetUserId: message.targetUserId,
            action: message.action,
            success: true
          }));
          break;
          
        case 'image':
          // 处理图片消息
          if (!userInfo) {
            ws.send(JSON.stringify({
              type: 'error',
              message: '请先加入聊天室'
            }));
            return;
          }
          // Validate message content
          if (!message.content || typeof message.content !== 'object' || !message.content.url || !message.content.imageId || !message.content.alt) {
            ws.send(JSON.stringify({
              type: 'error',
              message: '消息内容不完整'
            }));
            return;
          }
          const imageMessage = {
            type: 'image',
            id: uuidv4(),
            from: userId,
            fromName: userInfo.name,
            userId: userInfo.id,
            role: userInfo.role,
            country: userInfo.country,
            content: message.content,
            timestamp: new Date().toISOString(),
            room: userInfo.room,
            revoked: false,
            edited: false,
            deleted: false,
            avatarUrl: AvatarService.generateRoleBasedAvatar(userInfo.name, userInfo.role, 40)
          };
          // 保存到历史记录
          chatHistory.group.push(imageMessage);
          if (chatHistory.group.length > 100) {
            chatHistory.group.shift();
          }
          store.addMessage({
            id: imageMessage.id,
            room: userInfo.room,
            sender: userId,
            username: userInfo.name,
            userId: userInfo.id,
            role: userInfo.role,
            country: userInfo.country,
            content: message.content.url,
            text: message.content.alt,
            timestamp: imageMessage.timestamp,
            edited: false,
            deleted: false,
            revoked: false
          });
          // 广播消息
          broadcastMessage(imageMessage);
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
    
    // Clean up any timers associated with this connection
    // Note: Currently timers are global, but this prevents potential issues
    console.log(`WebSocket connection closed for user: ${userInfo?.name || 'unknown'}`);
  });
});

// 处理计时器消息
function handleTimerMessage(data, ws) {
  const key = 'main';
  let timerData = timers.get(key);
  
  // Validate time input
  const validateTime = (time) => {
    const num = parseInt(time);
    return !isNaN(num) && num >= 0 ? num : 300; // Default to 300 seconds if invalid
  };
  
  switch (data.action) {
    case 'start': {
      // 如果不存在，则创建，否则更新，且记录初始时间
      const t = validateTime(data.time || (timerData? timerData.initialTime : 300));
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
      const resetTime = validateTime(data.time != null ? data.time : (timerData? timerData.initialTime : 300));
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
      const setTime = validateTime(data.time);
      timerData = { remainingTime: setTime, initialTime: setTime, interval: null };
      timers.set(key, timerData);
      broadcastMessage({ type: 'timer', time: setTime });
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
    country: user.country,
    canSpeak: user.canSpeak,
    isSpeaking: user.isSpeaking,
    isRaisingHand: user.isRaisingHand,
    lastSpeakTime: user.lastSpeakTime,
    speakTimeLimit: user.speakTimeLimit,
    score: user.score,
    joinTime: user.joinTime,
    avatarUrl: AvatarService.generateRoleBasedAvatar(user.name, user.role, 32)
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
  console.log('📢 Broadcasting message:', {
    type: message.type,
    id: message.id,
    from: message.fromName,
    content: message.content,
    timestamp: message.timestamp
  });
  
  let sentCount = 0;
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
      sentCount++;
    }
  });
  
  console.log(`📢 Message sent to ${sentCount} clients`);
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
app.use(express.json());

// 静态文件服务配置
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// 图片上传相关路由
app.use('/api/images', require('./routes/imageRoutes'));

// 语音聊天相关路由
app.use('/api/voice', require('./routes/voiceRoutes'));

// 表情支持相关路由
app.use('/api/emoji', require('./routes/emojiRoutes'));

// 消息管理相关路由
app.use('/api/messages', require('./routes/messageRoutes'));

// 管理员管理端口
app.use('/api/admin', require('./routes/adminRoutes'));

// 保留原 /test 路由，指向原始 API 测试页面
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

// 新增测试路由 /test-room，指向前端研讨室登录测试页面
app.get('/test-room', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test-room.html'));
});

// 用户列表页面
app.get('/user-list', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user-list.html'));
});

// 聊天室页面
app.get('/chat-room', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat-room.html'));
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

// ---- DATA PERSISTENCE ----
try {
  persistence.loadInitialData(store);
  console.log('✅ Data loaded successfully.');
} catch (error) {
  console.error('❌ Failed to load data:', error);
}

const SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
setInterval(() => {
  try {
    persistence.saveCurrentData(store);
    console.log('💾 Data saved periodically.');
  } catch (error) {
    console.error('❌ Failed to save data periodically:', error);
  }
}, SAVE_INTERVAL);

process.on('SIGINT', () => {
  console.log('SIGINT signal received: saving data before exit.');
  try {
    persistence.saveCurrentData(store);
    console.log('💾 Data saved on exit.');
  } catch (error) {
    console.error('❌ Failed to save data on exit:', error);
  }
  process.exit(0);
});
// ---- END DATA PERSISTENCE ----

if (process.env.USE_MYSQL === 'true') {
  mysqlService.init().catch(err => console.error('MySQL init error', err));
}

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔌 WebSocket server is listening on the same port.`);
  });
}

module.exports = app;
