const store = require('../data/store');
const { processEmojiMessage } = require('./emojiController');

// 编辑消息
async function editMessage(req, res) {
  const { messageId } = req.params;
  const { content } = req.body;
  
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: '消息内容不能为空' });
  }
  
  const message = store.getMessage(messageId);
  if (!message) {
    return res.status(404).json({ error: '消息不存在' });
  }
  
  // 检查权限：只有消息发送者或管理员可以编辑
  if (message.sender !== req.user.username && 
      !['admin', 'sys', 'host'].includes(req.user.role)) {
    return res.status(403).json({ error: '没有权限编辑此消息' });
  }
  
  // 处理表情
  const processedContent = await processEmojiMessage(content.trim());
  
  // 更新消息
  message.content = processedContent;
  message.edited = true;
  message.editTime = new Date().toISOString();
  message.editBy = req.user.username;
  
  // 记录编辑日志
  store.addMessageLog({
    action: 'edit',
    messageId: message.id,
    originalContent: message.originalContent || message.content,
    newContent: processedContent,
    editedBy: req.user.username,
    roomId: message.room
  });
  
  res.json({ status: 'ok', message });
}

// 撤销消息
async function revokeMessage(req, res) {
  const { messageId } = req.params;
  
  const message = store.getMessage(messageId);
  if (!message) {
    return res.status(404).json({ error: '消息不存在' });
  }
  
  // 检查权限：只有消息发送者或管理员可以撤销
  if (message.sender !== req.user.username && 
      !['admin', 'sys', 'host'].includes(req.user.role)) {
    return res.status(403).json({ error: '没有权限撤销此消息' });
  }
  
  // 标记消息为已撤销
  message.deleted = true;
  message.revokeTime = new Date().toISOString();
  message.revokedBy = req.user.username;
  
  // 记录撤销日志
  store.addMessageLog({
    action: 'revoke',
    messageId: message.id,
    content: message.content,
    revokedBy: req.user.username,
    roomId: message.room
  });
  
  res.json({ status: 'ok', message: '消息已撤销' });
}

// 获取消息历史（包括已撤销的消息）
async function getMessageHistory(req, res) {
  const { roomId } = req.params;
  const { includeDeleted = false, limit = 100, offset = 0 } = req.query;
  
  let messages = store.getMessages(roomId) || [];
  
  // 如果不包含已删除的消息，则过滤掉
  if (!includeDeleted) {
    messages = messages.filter(msg => !msg.deleted);
  }
  
  // 分页
  const total = messages.length;
  messages = messages.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({
    status: 'ok',
    messages,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: parseInt(offset) + parseInt(limit) < total
    }
  });
}

// 获取消息日志
async function getMessageLogs(req, res) {
  const { roomId } = req.params;
  const { action, startDate, endDate, limit = 50 } = req.query;
  
  const logs = store.getMessageLogs(roomId, action, startDate, endDate, parseInt(limit));
  
  res.json({ status: 'ok', logs });
}

// 记录消息操作日志
function logMessageAction(logEntry) {
  store.addMessageLog(logEntry);
}

// 获取消息统计
async function getMessageStats(req, res) {
  const { roomId } = req.params;
  const messages = store.getMessages(roomId) || [];
  
  const stats = {
    total: messages.length,
    active: messages.filter(msg => !msg.deleted).length,
    deleted: messages.filter(msg => msg.deleted).length,
    edited: messages.filter(msg => msg.edited).length,
    byUser: {},
    byHour: {},
    byDay: {}
  };
  
  // 按用户统计
  messages.forEach(msg => {
    if (!stats.byUser[msg.sender]) {
      stats.byUser[msg.sender] = { total: 0, active: 0, deleted: 0, edited: 0 };
    }
    stats.byUser[msg.sender].total++;
    if (msg.deleted) {
      stats.byUser[msg.sender].deleted++;
    } else {
      stats.byUser[msg.sender].active++;
    }
    if (msg.edited) {
      stats.byUser[msg.sender].edited++;
    }
  });
  
  // 按小时统计
  messages.forEach(msg => {
    const hour = new Date(msg.timestamp).getHours();
    stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
  });
  
  // 按天统计
  messages.forEach(msg => {
    const day = new Date(msg.timestamp).toDateString();
    stats.byDay[day] = (stats.byDay[day] || 0) + 1;
  });
  
  res.json({ status: 'ok', stats });
}

// 批量操作消息（管理员功能）
async function batchMessageAction(req, res) {
  const { action, messageIds } = req.body;
  
  if (!['delete', 'restore'].includes(action)) {
    return res.status(400).json({ error: '无效的操作类型' });
  }
  
  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return res.status(400).json({ error: '请选择要操作的消息' });
  }
  
  const results = [];
  
  for (const messageId of messageIds) {
    const message = store.getMessage(messageId);
    if (message) {
      if (action === 'delete') {
        message.deleted = true;
        message.revokeTime = new Date().toISOString();
        message.revokedBy = req.user.username;
      } else if (action === 'restore') {
        message.deleted = false;
        message.revokeTime = null;
        message.revokedBy = null;
      }
      
      results.push({ messageId, success: true });
      
      // 记录操作日志
      store.addMessageLog({
        action: action === 'delete' ? 'batch_delete' : 'batch_restore',
        messageId: message.id,
        content: message.content,
        operatedBy: req.user.username,
        roomId: message.room
      });
    } else {
      results.push({ messageId, success: false, error: '消息不存在' });
    }
  }
  
  res.json({ status: 'ok', results });
}

module.exports = {
  editMessage,
  revokeMessage,
  getMessageHistory,
  getMessageLogs,
  getMessageStats,
  batchMessageAction,
  logMessageAction
}; 