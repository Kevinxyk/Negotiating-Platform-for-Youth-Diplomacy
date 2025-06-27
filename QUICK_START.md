# 多用户测试快速开始指南

## 🚀 快速开始 (5分钟)

### 1. 启动服务器
```bash
cd my-backend
npm start
```

### 2. 运行多用户测试
```bash
# 方法1: 使用npm脚本
npm run test:multi-user

# 方法2: 直接运行脚本
node scripts/multi-user-test.js

# 方法3: 使用启动脚本 (Windows)
run-multi-user-test.bat

# 方法3: 使用启动脚本 (PowerShell)
powershell -ExecutionPolicy Bypass -File run-multi-user-test.ps1
```

### 3. 查看结果
测试完成后会显示详细的性能报告，包括：
- 连接成功率
- 消息发送成功率
- 响应时间统计
- 性能基准检查

## 📊 测试配置

### 修改测试参数
编辑 `scripts/test-config.js` 文件：

```javascript
// 修改用户数量
test: {
  userCount: 10,  // 改为10个用户
  testDuration: 60000,  // 改为60秒
  messageInterval: 2000  // 改为2秒发送一次
}
```

### 常用配置组合

**轻量测试 (快速验证)**
```javascript
test: {
  userCount: 3,
  testDuration: 15000,
  messageInterval: 2000
}
```

**标准测试 (推荐)**
```javascript
test: {
  userCount: 5,
  testDuration: 30000,
  messageInterval: 3000
}
```

**压力测试 (性能验证)**
```javascript
test: {
  userCount: 20,
  testDuration: 60000,
  messageInterval: 1000
}
```

## 🔧 故障排除

### 常见问题

**1. 连接失败**
```
❌ delegate1 连接错误: connect ECONNREFUSED 127.0.0.1:3000
```
**解决方案**: 确保服务器正在运行 `npm start`

**2. 认证失败**
```
❌ delegate1 消息解析错误: jwt malformed
```
**解决方案**: 检查JWT密钥配置是否正确

**3. 端口被占用**
```
❌ delegate1 连接错误: connect ECONNREFUSED 127.0.0.1:3000
```
**解决方案**: 修改 `test-config.js` 中的端口号

### 调试模式

启用详细日志：
```javascript
logging: {
  level: 'debug',  // 改为debug级别
  showTimestamps: true,
  showUserDetails: true
}
```

## 📈 性能基准

测试脚本会自动检查以下性能指标：

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 连接成功率 | ≥99% | 用户连接成功率 |
| 消息成功率 | ≥99% | 消息发送成功率 |
| 响应时间 | ≤100ms | 平均响应时间 |
| 并发用户 | ≥100 | 支持的最大并发用户数 |

## 🎯 测试场景

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

## 🔄 自动化测试

### 集成到CI/CD
```bash
# 运行所有测试
npm run test:all

# 只运行多用户测试
npm run test:multi-user
```

### 定时测试
```bash
# 每小时运行一次测试
0 * * * * cd /path/to/my-backend && npm run test:multi-user
```

## 📝 自定义测试

### 添加新的测试消息
编辑 `test-config.js` 中的 `messages` 数组：

```javascript
messages: [
  '大家好，我是{country}的代表{username}',
  '我认为我们应该讨论这个重要议题',
  // 添加你的自定义消息...
  '这是一个新的测试消息'
]
```

### 添加新的用户角色
```javascript
users: [
  // 现有用户...
  { username: 'newuser', role: 'delegate', country: '新国家' }
]
```

### 自定义性能基准
```javascript
benchmarks: {
  minConnectionSuccessRate: 0.95,  // 降低要求到95%
  minMessageSuccessRate: 0.98,     // 降低要求到98%
  maxResponseTime: 200,            // 放宽到200ms
}
```

## 🎉 成功标志

当看到以下输出时，说明测试成功：

```
🎯 性能基准检查:
🔗 连接成功率: ✅ 100.0% (目标: 99.0%)
💬 消息成功率: ✅ 100.0% (目标: 99.0%)
⚡ 响应时间: ✅ 45.2ms (目标: ≤100ms)

🎉 所有基准测试通过！
```

## 📞 获取帮助

如果遇到问题：

1. 查看 `MULTI_USER_TEST_README.md` 获取详细文档
2. 检查服务器日志 `npm start`
3. 启用调试模式查看详细日志
4. 确保所有依赖已正确安装 `npm install`

---

**提示**: 建议在每次重要更新后都运行多用户测试，确保系统稳定性。 