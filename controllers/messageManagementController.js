/**
 * GET /api/admin/messages
 * 获取所有消息（管理员权限）
 */
async function getAllMessages(req, res) {
  try {
    const { room, limit = 100, offset = 0, includeRevoked = false } = req.query;
    
    let messages = await messageManagementService.getAllMessages({
      room,
      limit: parseInt(limit),
      offset: parseInt(offset),
      includeRevoked: includeRevoked === 'true'
    });
    
    // 确保每条消息都有完整信息
    const enrichedMessages = messages.map(msg => ({
      id: msg.id,
      room: msg.room,
      username: msg.username,
      userId: msg.userId,
      role: msg.role,
      country: msg.country,
      text: msg.text,
      content: msg.content,
      timestamp: msg.timestamp,
      edited: msg.edited || false,
      deleted: msg.deleted || false,
      revoked: msg.revoked || false,
      editTime: msg.editTime,
      editBy: msg.editBy,
      revokeTime: msg.revokeTime,
      revokedBy: msg.revokedBy
    }));
    
    res.json({
      success: true,
      data: enrichedMessages,
      total: enrichedMessages.length
    });
  } catch (error) {
    console.error('Error getting all messages:', error);
    res.status(500).json({
      success: false,
      error: '获取消息失败'
    });
  }
} 