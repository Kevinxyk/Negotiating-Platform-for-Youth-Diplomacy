const store = require('../data/store');

/**
 * GET /api/admin/users
 * 获取房间用户列表（管理员权限）
 */
async function getRoomUsers(req, res) {
  try {
    const { roomId, sortBy = 'role', sortOrder = 'asc' } = req.query;
    
    // 从WebSocket连接中获取在线用户
    const onlineUsers = global.onlineUsers || new Map();
    let users = Array.from(onlineUsers.values())
      .filter(user => !roomId || user.room === roomId)
      .map(user => ({
        userId: user.userId,
        username: user.username,
        role: user.role,
        country: user.country,
        canSpeak: user.canSpeak,
        isSpeaking: user.isSpeaking,
        isRaisingHand: user.isRaisingHand,
        lastSpeakTime: user.lastSpeakTime,
        speakTimeLimit: user.speakTimeLimit,
        score: user.score,
        joinTime: user.joinTime
      }));
    
    // 排序
    const roleOrder = {
      'sys': 1,
      'admin': 2,
      'host': 3,
      'judge': 4,
      'observer': 5,
      'delegate': 6,
      'student': 7
    };
    
    users.sort((a, b) => {
      if (sortBy === 'role') {
        const orderA = roleOrder[a.role] || 999;
        const orderB = roleOrder[b.role] || 999;
        return sortOrder === 'asc' ? orderA - orderB : orderB - orderA;
      } else if (sortBy === 'name') {
        return sortOrder === 'asc' ? a.username.localeCompare(b.username) : b.username.localeCompare(a.username);
      } else if (sortBy === 'country') {
        return sortOrder === 'asc' ? a.country.localeCompare(b.country) : b.country.localeCompare(a.country);
      } else if (sortBy === 'score') {
        return sortOrder === 'asc' ? a.score - b.score : b.score - a.score;
      }
      return 0;
    });
    
    res.json({
      success: true,
      data: users,
      total: users.length
    });
  } catch (error) {
    console.error('Error getting room users:', error);
    res.status(500).json({
      success: false,
      error: '获取用户列表失败'
    });
  }
}

/**
 * PUT /api/admin/users/:userId/status
 * 更新用户状态（管理员权限）
 */
async function updateUserStatus(req, res) {
  try {
    const { userId } = req.params;
    const { action, value } = req.body;
    
    // 检查权限
    if (!['host', 'judge', 'admin', 'sys'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: '没有权限执行此操作'
      });
    }
    
    // 这里需要通过WebSocket发送消息来更新用户状态
    // 因为用户状态存储在WebSocket连接中
    res.json({
      success: true,
      message: '请通过WebSocket发送updateUserStatus消息来更新用户状态'
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      error: '更新用户状态失败'
    });
  }
}

/**
 * GET /api/admin/users/stats
 * 获取用户统计信息（管理员权限）
 */
async function getUserStats(req, res) {
  try {
    const { roomId } = req.query;
    
    const onlineUsers = global.onlineUsers || new Map();
    const users = Array.from(onlineUsers.values())
      .filter(user => !roomId || user.room === roomId);
    
    const stats = {
      total: users.length,
      byRole: {},
      byCountry: {},
      speaking: users.filter(u => u.isSpeaking).length,
      raisingHand: users.filter(u => u.isRaisingHand).length,
      canSpeak: users.filter(u => u.canSpeak).length,
      averageScore: 0
    };
    
    // 按角色统计
    users.forEach(user => {
      stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
      stats.byCountry[user.country] = (stats.byCountry[user.country] || 0) + 1;
    });
    
    // 计算平均分
    const totalScore = users.reduce((sum, user) => sum + (user.score || 0), 0);
    stats.averageScore = users.length > 0 ? totalScore / users.length : 0;
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      error: '获取用户统计失败'
    });
  }
}

module.exports = {
  getRoomUsers,
  updateUserStatus,
  getUserStats
}; 