#!/bin/bash

echo "多用户测试启动脚本"
echo "==================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

echo "1. 检查依赖是否安装..."
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
fi

echo "2. 启动服务器..."
npm start &
SERVER_PID=$!

echo "3. 等待服务器启动..."
sleep 3

echo "4. 运行多用户测试..."
node scripts/multi-user-test.js

echo "5. 测试完成，关闭服务器..."
kill $SERVER_PID 2>/dev/null

echo "测试完成！" 