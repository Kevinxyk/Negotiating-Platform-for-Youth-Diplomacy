# 多用户测试指南

本指南将帮助你在本地方运行多用户测试，以验证系统的并发性能和功能。

## 测试方法

### 方法1: 使用Node.js脚本测试 (推荐)

1. **启动服务器**
   ```bash
   cd my-backend
   npm start
   ```

2. **运行多用户测试脚本**
   ```bash
   node scripts/multi-user-test.js
   ```

   这个脚本会：
   - 同时连接5个不同角色的用户
   - 自动发送消息
   - 模拟真实的用户交互
   - 输出测试结果和性能统计

### 方法2: 使用Jest集成测试

1. **运行现有的集成测试**
   ```bash
   cd my-backend
   npm test
   ```

   这会运行以下测试：
   - `tests/integration/textChat.test.js` - 文本聊天功能测试
   - `tests/integration/scoring.test.js` - 评分功能测试

### 方法3: 手动浏览器测试

1. **启动服务器**
   ```bash
   cd my-backend
   npm start
   ```

2. **打开多个浏览器窗口**
   - 访问 `http://localhost:3000/chat-room.html`
   - 在每个窗口中登录不同的用户
   - 手动测试聊天、举手等功能

## 测试配置

### 修改测试参数

编辑 `scripts/multi-user-test.js` 中的配置：

```javascript
const config = {
  serverUrl: 'ws://localhost:3000',  // 服务器地址
  roomId: 'test-room',               // 房间ID
  userCount: 5,                      // 用户数量
  testDuration: 30000                // 测试时长(毫秒)
};
```

### 用户角色配置

```javascript
const users = [
  { username: 'delegate1', role: 'delegate', country: '中国' },
  { username: 'delegate2', role: 'delegate', country: '美国' },
  { username: 'delegate3', role: 'delegate', country: '俄罗斯' },
  { username: 'judge1', role: 'judge', country: '联合国' },
  { username: 'host1', role: 'host', country: '联合国' }
];
```

## 测试场景

### 基础功能测试
- ✅ 多用户同时连接
- ✅ 用户加入/离开房间
- ✅ 群聊消息发送/接收
- ✅ 用户列表更新
- ✅ 举手功能

### 性能测试
- ✅ 连接稳定性
- ✅ 消息发送成功率
- ✅ 消息处理延迟
- ✅ 内存使用情况

### 压力测试
- ✅ 大量用户同时连接
- ✅ 高频消息发送
- ✅ 长时间运行稳定性

## 监控指标

测试脚本会输出以下指标：

```
📊 测试结果:
⏱️  时长: 30000ms
💬 消息数: 45
📈 消息率: 1.5 消息/秒
```

## 故障排除

### 常见问题

1. **连接失败**
   - 确保服务器正在运行
   - 检查端口3000是否被占用
   - 验证WebSocket URL是否正确

2. **认证失败**
   - 检查JWT密钥配置
   - 确保用户角色配置正确

3. **消息发送失败**
   - 检查网络连接
   - 验证房间ID是否正确
   - 查看服务器日志

### 调试技巧

1. **查看服务器日志**
   ```bash
   cd my-backend
   npm start
   ```

2. **使用浏览器开发者工具**
   - 打开Network标签页
   - 查看WebSocket连接状态
   - 检查控制台错误

3. **修改日志级别**
   在 `app.js` 中添加更多日志输出

## 扩展测试

### 添加新的测试场景

1. **音频聊天测试**
   ```javascript
   // 在multi-user-test.js中添加音频测试
   ws.send(audioData, { binary: true });
   ```

2. **私聊测试**
   ```javascript
   ws.send(JSON.stringify({
     type: 'private',
     to: targetUserId,
     content: '私聊消息'
   }));
   ```

3. **权限测试**
   ```javascript
   // 测试不同角色的权限
   ws.send(JSON.stringify({
     type: 'updateUserStatus',
     targetUserId: 'user1',
     action: 'toggleSpeak'
   }));
   ```

### 性能基准

建议的性能指标：
- 连接成功率: > 99%
- 消息发送成功率: > 99%
- 平均响应时间: < 100ms
- 支持并发用户数: > 100

## 自动化测试

### 集成到CI/CD

在 `package.json` 中添加测试脚本：

```json
{
  "scripts": {
    "test:multi-user": "node scripts/multi-user-test.js",
    "test:all": "npm test && npm run test:multi-user"
  }
}
```

### 定时测试

使用cron任务定期运行测试：

```bash
# 每小时运行一次多用户测试
0 * * * * cd /path/to/my-backend && node scripts/multi-user-test.js
```

## 总结

多用户测试是验证系统稳定性和性能的重要环节。通过以上方法，你可以：

1. 快速验证基本功能
2. 发现并发问题
3. 评估系统性能
4. 确保生产环境稳定性

建议在每次重要更新后都运行多用户测试，确保系统质量。 