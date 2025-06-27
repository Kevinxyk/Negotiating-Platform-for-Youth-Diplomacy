@echo off
echo 多用户测试启动脚本
echo ====================

echo 1. 检查Node.js是否安装...
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

echo 2. 检查依赖是否安装...
if not exist "node_modules" (
    echo 安装依赖...
    npm install
)

echo 3. 启动服务器...
start "NPYD Server" cmd /k "npm start"

echo 4. 等待服务器启动...
timeout /t 3 /nobreak >nul

echo 5. 运行多用户测试...
node scripts/multi-user-test.js

echo 6. 测试完成，按任意键关闭服务器...
pause

echo 7. 关闭服务器...
taskkill /f /im node.exe >nul 2>&1

echo 测试完成！
pause 