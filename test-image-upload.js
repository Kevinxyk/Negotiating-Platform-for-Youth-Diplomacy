const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testImageUpload() {
  try {
    // 创建一个测试图片文件
    const testImagePath = path.join(__dirname, 'test-image.png');
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(testImagePath, testImageBuffer);
    
    console.log('测试图片已创建:', testImagePath);
    
    // 创建FormData
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath));
    formData.append('roomId', 'test-room-123');
    
    // 发送请求
    const response = await fetch('http://localhost:3000/api/images/upload', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token'
      },
      body: formData
    });
    
    console.log('响应状态:', response.status);
    const result = await response.json();
    console.log('响应内容:', result);
    
    // 清理测试文件
    fs.unlinkSync(testImagePath);
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testImageUpload(); 