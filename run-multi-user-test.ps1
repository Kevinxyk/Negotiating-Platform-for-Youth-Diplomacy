Write-Host "多用户测试启动脚本" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green

# 检查Node.js是否安装
try {
    $nodeVersion = node --version
    Write-Host "Node.js版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "错误: 未找到Node.js，请先安装Node.js" -ForegroundColor Red
    Read-Host "按任意键退出"
    exit 1
}

Write-Host "1. 检查依赖是否安装..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "安装依赖..." -ForegroundColor Yellow
    npm install
}

Write-Host "2. 启动服务器..." -ForegroundColor Yellow
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm start
}

Write-Host "3. 等待服务器启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "4. 运行多用户测试..." -ForegroundColor Yellow
node scripts/multi-user-test.js

Write-Host "5. 测试完成，关闭服务器..." -ForegroundColor Yellow
Stop-Job $serverJob
Remove-Job $serverJob

Write-Host "测试完成！" -ForegroundColor Green
Read-Host "按任意键退出" 