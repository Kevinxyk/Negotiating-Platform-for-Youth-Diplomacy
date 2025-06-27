// 多用户测试配置文件
// 修改这些参数来自定义测试行为

module.exports = {
  // 服务器配置
  server: {
    url: 'ws://localhost:3000',
    roomId: 'test-room'
  },

  // 测试配置
  test: {
    userCount: 5,           // 同时连接的用户数量
    testDuration: 30000,    // 测试持续时间(毫秒)
    messageInterval: 3000,  // 消息发送间隔(毫秒)
    autoMessages: true,     // 是否自动发送消息
    autoRaiseHand: true     // 是否自动举手
  },

  // 用户配置
  users: [
    { username: 'delegate1', role: 'delegate', country: '中国' },
    { username: 'delegate2', role: 'delegate', country: '美国' },
    { username: 'delegate3', role: 'delegate', country: '俄罗斯' },
    { username: 'delegate4', role: 'delegate', country: '英国' },
    { username: 'delegate5', role: 'delegate', country: '法国' },
    { username: 'judge1', role: 'judge', country: '联合国' },
    { username: 'judge2', role: 'judge', country: '联合国' },
    { username: 'host1', role: 'host', country: '联合国' },
    { username: 'observer1', role: 'observer', country: '观察员' },
    { username: 'admin1', role: 'admin', country: '管理员' }
  ],

  // 测试消息模板
  messages: [
    '大家好，我是{country}的代表{username}',
    '我认为我们应该讨论这个重要议题',
    '我同意刚才的观点',
    '让我们继续深入讨论',
    '这是一个很好的建议',
    '我们需要更多的信息',
    '我建议我们投票决定',
    '时间不多了，我们需要加快进度',
    '我代表{country}发言',
    '这个问题很重要，需要认真考虑'
  ],

  // 性能基准
  benchmarks: {
    minConnectionSuccessRate: 0.99,  // 最低连接成功率
    minMessageSuccessRate: 0.99,     // 最低消息发送成功率
    maxResponseTime: 100,            // 最大响应时间(毫秒)
    maxMemoryUsage: 100,             // 最大内存使用(MB)
    minConcurrentUsers: 100          // 最低支持并发用户数
  },

  // 日志配置
  logging: {
    level: 'info',                   // 日志级别: debug, info, warn, error
    showTimestamps: true,            // 是否显示时间戳
    showUserDetails: true,           // 是否显示用户详细信息
    saveToFile: false,               // 是否保存到文件
    logFile: 'multi-user-test.log'   // 日志文件名
  },

  // 高级配置
  advanced: {
    reconnectOnFailure: true,        // 连接失败时是否重连
    maxReconnectAttempts: 3,         // 最大重连次数
    heartbeatInterval: 30000,        // 心跳间隔(毫秒)
    connectionTimeout: 10000,        // 连接超时时间(毫秒)
    messageTimeout: 5000             // 消息超时时间(毫秒)
  }
}; 