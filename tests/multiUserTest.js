const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

// 测试配置
const TEST_CONFIG = {
  serverUrl: 'ws://localhost:3000',
  roomId: 'test-room',
  userCount: 5,
  testDuration: 30000, // 30秒
  messageInterval: 2000 // 每2秒发送一条消息
};

// 用户角色配置
const USER_ROLES = [
  { username: 'delegate1', role: 'delegate', country: '中国' },
  { username: 'delegate2', role: 'delegate', country: '美国' },
  { username: 'delegate3', role: 'delegate', country: '俄罗斯' },
  { username: 'judge1', role: 'judge', country: '联合国' },
  { username: 'host1', role: 'host', country: '联合国' }
];

class MultiUserTest {
  constructor() {
    this.connections = [];
    this.messageCount = 0;
    this.startTime = Date.now();
    this.testResults = {
      totalConnections: 0,
      successfulConnections: 0,
      failedConnections: 0,
      totalMessages: 0,
      successfulMessages: 0,
      failedMessages: 0,
      errors: []
    };
  }

  // 生成测试用的JWT token
  generateTestToken(userId, role) {
    return jwt.sign(
      { userId, role, username: userId },
      'your-secret-key',
      { expiresIn: '1h' }
    );
  }

  // 创建单个用户连接
  async createUserConnection(userIndex) {
    const user = USER_ROLES[userIndex];
    const token = this.generateTestToken(user.username, user.role);
    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(TEST_CONFIG.serverUrl);
      
      ws.on('open', () => {
        console.log(`✅ 用户 ${user.username} 连接成功`);
        
        // 发送加入房间消息
        ws.send(JSON.stringify({
          type: 'join',
          token: token,
          room: TEST_CONFIG.roomId,
          country: user.country
        }));
        
        this.testResults.totalConnections++;
        this.testResults.successfulConnections++;
        
        resolve(ws);
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          console.log(`📨 ${user.username} 收到消息:`, message.type);
          
          if (message.type === 'system' && message.message.includes('欢迎')) {
            console.log(`🎉 ${user.username} 成功加入房间`);
          }
        } catch (error) {
          console.error(`❌ ${user.username} 消息解析错误:`, error);
        }
      });
      
      ws.on('error', (error) => {
        console.error(`❌ ${user.username} 连接错误:`, error.message);
        this.testResults.failedConnections++;
        this.testResults.errors.push(`${user.username}: ${error.message}`);
        reject(error);
      });
      
      ws.on('close', () => {
        console.log(`🔌 ${user.username} 连接关闭`);
      });
    });
  }

  // 发送测试消息
  async sendTestMessage(ws, user) {
    const messages = [
      `大家好，我是${user.country}的代表${user.username}`,
      `我认为我们应该讨论这个重要议题`,
      `我同意刚才的观点`,
      `让我们继续深入讨论`,
      `这是一个很好的建议`
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    try {
      ws.send(JSON.stringify({
        type: 'chat',
        content: randomMessage,
        username: user.username
      }));
      
      this.testResults.totalMessages++;
      this.testResults.successfulMessages++;
      console.log(`💬 ${user.username} 发送消息: ${randomMessage}`);
    } catch (error) {
      this.testResults.failedMessages++;
      console.error(`❌ ${user.username} 发送消息失败:`, error.message);
    }
  }

  // 模拟用户举手
  async raiseHand(ws, user) {
    try {
      ws.send(JSON.stringify({
        type: 'raiseHand'
      }));
      console.log(`✋ ${user.username} 举手`);
    } catch (error) {
      console.error(`❌ ${user.username} 举手失败:`, error.message);
    }
  }

  // 运行多用户测试
  async runTest() {
    console.log('🚀 开始多用户测试...');
    console.log(`📊 测试配置: ${TEST_CONFIG.userCount}个用户, ${TEST_CONFIG.testDuration}ms`);
    
    try {
      // 创建所有用户连接
      const connectionPromises = [];
      for (let i = 0; i < TEST_CONFIG.userCount; i++) {
        connectionPromises.push(this.createUserConnection(i));
      }
      
      this.connections = await Promise.all(connectionPromises);
      console.log(`✅ 所有用户连接成功 (${this.connections.length}/${TEST_CONFIG.userCount})`);
      
      // 等待一段时间让连接稳定
      await this.sleep(2000);
      
      // 开始发送消息
      const messageIntervals = [];
      this.connections.forEach((ws, index) => {
        const user = USER_ROLES[index];
        
        // 定期发送消息
        const messageInterval = setInterval(() => {
          this.sendTestMessage(ws, user);
        }, TEST_CONFIG.messageInterval + Math.random() * 1000); // 添加随机延迟
        
        messageIntervals.push(messageInterval);
        
        // 随机举手
        if (Math.random() > 0.7) {
          setTimeout(() => {
            this.raiseHand(ws, user);
          }, Math.random() * TEST_CONFIG.testDuration);
        }
      });
      
      // 运行指定时间
      await this.sleep(TEST_CONFIG.testDuration);
      
      // 清理定时器
      messageIntervals.forEach(interval => clearInterval(interval));
      
      // 关闭所有连接
      this.connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      
      // 输出测试结果
      this.printTestResults();
      
    } catch (error) {
      console.error('❌ 测试执行失败:', error);
      this.testResults.errors.push(`测试执行失败: ${error.message}`);
      this.printTestResults();
    }
  }

  // 打印测试结果
  printTestResults() {
    const duration = Date.now() - this.startTime;
    console.log('\n📊 测试结果汇总:');
    console.log('='.repeat(50));
    console.log(`⏱️  测试时长: ${duration}ms`);
    console.log(`🔗 总连接数: ${this.testResults.totalConnections}`);
    console.log(`✅ 成功连接: ${this.testResults.successfulConnections}`);
    console.log(`❌ 失败连接: ${this.testResults.failedConnections}`);
    console.log(`💬 总消息数: ${this.testResults.totalMessages}`);
    console.log(`✅ 成功消息: ${this.testResults.successfulMessages}`);
    console.log(`❌ 失败消息: ${this.testResults.failedMessages}`);
    
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ 错误列表:');
      this.testResults.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }
    
    console.log('='.repeat(50));
  }

  // 工具函数：延时
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 运行测试
async function runMultiUserTest() {
  const test = new MultiUserTest();
  await test.runTest();
}

// 如果直接运行此文件
if (require.main === module) {
  runMultiUserTest().catch(console.error);
}

module.exports = { MultiUserTest, runMultiUserTest }; 