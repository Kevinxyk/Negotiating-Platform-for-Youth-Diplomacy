// File: my-backend/server.js
"use strict";

const express = require('express');
const app = express();
const PORT = 4000;

// 引入各功能模块的路由
const timeRoutes         = require('./routes/timeRoutes');
const textChatRoutes     = require('./routes/textChatRoutes');
const audioChatRoutes    = require('./routes/audioChatRoutes');
const participantRoutes  = require('./routes/participantRoutes');
const scoringRoutes      = require('./routes/scoringRoutes');
const aiAnalysisRoutes   = require('./routes/aiAnalysisRoutes');
const imageRoutes        = require('./routes/imageRoutes');
const timezoneRoutes = require('./routes/timezoneRoutes');
const eventBus = require('./services/eventBus');

// 支持 JSON 请求体
app.use(express.json());

// 挂载各模块路由
app.use('/api/time',         timeRoutes);
app.use('/api/chat',         textChatRoutes);
app.use('/api/audio',        audioChatRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/score',        scoringRoutes);
app.use('/api/analysis',     aiAnalysisRoutes);
app.use('/api/images',       imageRoutes);
app.use('/api/timezones', timezoneRoutes);

// 健康检查
app.get('/', (req, res) => {
  res.send('🚀 Server is up and running!');
});

app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});

eventBus.on('timeEnd', (eventKey) => {
  console.log(`⏰ Event '${eventKey}' ended at`, new Date().toISOString());
  // TODO: notify clients via WebSocket or other mechanism
});