const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const config = require('./test-config');

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
      errors: [],
      performance: {
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity
      }
    };
  }

  generateToken(userId, role) {
    return jwt.sign(
      { userId, role, username: userId },
      'your-secret-key',
      { expiresIn: '1h' }
    );
  }

  log(message, level = 'info') {
    const timestamp = config.logging.showTimestamps ? `[${new Date().toISOString()}] ` : '';
    const logLevel = config.logging.level;
    
    if (level === 'debug' && logLevel !== 'debug') return;
    if (level === 'info' && ['warn', 'error'].includes(logLevel)) return;
    if (level === 'warn' && logLevel === 'error') return;
    
    console.log(`${timestamp}${message}`);
  }

  createConnection(user, index) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(config.server.url);
      
      ws.on('open', () => {
        this.log(`✅ ${user.username} 连接成功`, 'info');
        
        ws.send(JSON.stringify({
          type: 'join',
          token: this.generateToken(user.username, user.role),
          room: config.server.roomId,
          country: user.country
        }));
        
        this.testResults.totalConnections++;
        this.testResults.successfulConnections++;
        
        resolve(ws);
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          if (message.type === 'system' && message.message.includes('欢迎')) {
            this.log(`🎉 ${user.username} 加入房间成功`, 'info');
          }
        } catch (error) {
          this.log(`❌ ${user.username} 消息解析错误: ${error.message}`, 'error');
        }
      });
      
      ws.on('error', (error) => {
        this.log(`❌ ${user.username} 连接错误: ${error.message}`, 'error');
        this.testResults.failedConnections++;
        this.testResults.errors.push(`${user.username}: ${error.message}`);
        reject(error);
      });
      
      ws.on('close', () => {
        this.log(`🔌 ${user.username} 连接关闭`, 'info');
      });
    });
  }

  sendMessage(ws, user) {
    const messages = config.messages;
    const messageTemplate = messages[Math.floor(Math.random() * messages.length)];
    const message = messageTemplate
      .replace('{country}', user.country)
      .replace('{username}', user.username);
    
    const startTime = Date.now();
    
    try {
      ws.send(JSON.stringify({
        type: 'chat',
        content: message
      }));
      
      this.testResults.totalMessages++;
      this.testResults.successfulMessages++;
      
      const responseTime = Date.now() - startTime;
      this.testResults.performance.avgResponseTime = 
        (this.testResults.performance.avgResponseTime * (this.testResults.successfulMessages - 1) + responseTime) / this.testResults.successfulMessages;
      this.testResults.performance.maxResponseTime = Math.max(this.testResults.performance.maxResponseTime, responseTime);
      this.testResults.performance.minResponseTime = Math.min(this.testResults.performance.minResponseTime, responseTime);
      
      this.log(`💬 ${user.username}: ${message}`, 'debug');
    } catch (error) {
      this.testResults.failedMessages++;
      this.log(`❌ ${user.username} 发送失败: ${error.message}`, 'error');
    }
  }

  raiseHand(ws, user) {
    try {
      ws.send(JSON.stringify({
        type: 'raiseHand'
      }));
      this.log(`✋ ${user.username} 举手`, 'debug');
    } catch (error) {
      this.log(`❌ ${user.username} 举手失败: ${error.message}`, 'error');
    }
  }

  async runTest() {
    this.log('🚀 开始多用户测试...', 'info');
    this.log(`📊 配置: ${config.test.userCount}个用户, ${config.test.testDuration}ms`, 'info');
    
    try {
      // 创建连接
      const connectionPromises = [];
      const userCount = Math.min(config.test.userCount, config.users.length);
      
      for (let i = 0; i < userCount; i++) {
        connectionPromises.push(this.createConnection(config.users[i], i));
      }
      
      this.connections = await Promise.all(connectionPromises);
      this.log(`✅ 所有用户连接成功 (${this.connections.length}/${userCount})`, 'info');
      
      // 等待连接稳定
      await this.sleep(2000);
      
      // 开始发送消息
      const intervals = [];
      this.connections.forEach((ws, index) => {
        if (config.test.autoMessages) {
          const interval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              this.sendMessage(ws, config.users[index]);
            } else {
              clearInterval(interval);
            }
          }, config.test.messageInterval + Math.random() * 2000);
          
          intervals.push(interval);
        }
        
        // 自动举手
        if (config.test.autoRaiseHand && Math.random() > 0.7) {
          setTimeout(() => {
            this.raiseHand(ws, config.users[index]);
          }, Math.random() * config.test.testDuration);
        }
      });
      
      // 运行指定时间
      await this.sleep(config.test.testDuration);
      
      // 清理
      intervals.forEach(interval => clearInterval(interval));
      this.connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      
      // 输出结果
      this.printTestResults();
      
    } catch (error) {
      this.log(`❌ 测试失败: ${error.message}`, 'error');
      this.testResults.errors.push(`测试执行失败: ${error.message}`);
      this.printTestResults();
    }
  }

  printTestResults() {
    const duration = Date.now() - this.startTime;
    const connectionSuccessRate = this.testResults.totalConnections > 0 ? 
      (this.testResults.successfulConnections / this.testResults.totalConnections).toFixed(3) : 0;
    const messageSuccessRate = this.testResults.totalMessages > 0 ? 
      (this.testResults.successfulMessages / this.testResults.totalMessages).toFixed(3) : 0;
    
    console.log('\n📊 测试结果汇总:');
    console.log('='.repeat(60));
    console.log(`⏱️  测试时长: ${duration}ms`);
    console.log(`🔗 总连接数: ${this.testResults.totalConnections}`);
    console.log(`✅ 成功连接: ${this.testResults.successfulConnections}`);
    console.log(`❌ 失败连接: ${this.testResults.failedConnections}`);
    console.log(`📈 连接成功率: ${(connectionSuccessRate * 100).toFixed(1)}%`);
    console.log(`💬 总消息数: ${this.testResults.totalMessages}`);
    console.log(`✅ 成功消息: ${this.testResults.successfulMessages}`);
    console.log(`❌ 失败消息: ${this.testResults.failedMessages}`);
    console.log(`📈 消息成功率: ${(messageSuccessRate * 100).toFixed(1)}%`);
    console.log(`📈 消息率: ${(this.testResults.successfulMessages / (duration / 1000)).toFixed(1)} 消息/秒`);
    
    if (this.testResults.successfulMessages > 0) {
      console.log(`⚡ 平均响应时间: ${this.testResults.performance.avgResponseTime.toFixed(1)}ms`);
      console.log(`⚡ 最大响应时间: ${this.testResults.performance.maxResponseTime}ms`);
      console.log(`⚡ 最小响应时间: ${this.testResults.performance.minResponseTime === Infinity ? 'N/A' : this.testResults.performance.minResponseTime + 'ms'}`);
    }
    
    // 性能基准检查
    this.checkBenchmarks(connectionSuccessRate, messageSuccessRate);
    
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ 错误列表:');
      this.testResults.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }
    
    console.log('='.repeat(60));
  }

  checkBenchmarks(connectionSuccessRate, messageSuccessRate) {
    const benchmarks = config.benchmarks;
    console.log('\n🎯 性能基准检查:');
    
    const connectionPass = connectionSuccessRate >= benchmarks.minConnectionSuccessRate;
    const messagePass = messageSuccessRate >= benchmarks.minMessageSuccessRate;
    const responsePass = this.testResults.performance.avgResponseTime <= benchmarks.maxResponseTime;
    
    console.log(`🔗 连接成功率: ${connectionSuccessRate >= benchmarks.minConnectionSuccessRate ? '✅' : '❌'} ${(connectionSuccessRate * 100).toFixed(1)}% (目标: ${(benchmarks.minConnectionSuccessRate * 100).toFixed(1)}%)`);
    console.log(`💬 消息成功率: ${messageSuccessRate >= benchmarks.minMessageSuccessRate ? '✅' : '❌'} ${(messageSuccessRate * 100).toFixed(1)}% (目标: ${(benchmarks.minMessageSuccessRate * 100).toFixed(1)}%)`);
    console.log(`⚡ 响应时间: ${this.testResults.performance.avgResponseTime <= benchmarks.maxResponseTime ? '✅' : '❌'} ${this.testResults.performance.avgResponseTime.toFixed(1)}ms (目标: ≤${benchmarks.maxResponseTime}ms)`);
    
    const allPassed = connectionPass && messagePass && responsePass;
    console.log(`\n${allPassed ? '🎉 所有基准测试通过！' : '⚠️  部分基准测试未通过'}`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 运行测试
async function main() {
  const test = new MultiUserTest();
  await test.runTest();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = MultiUserTest; 