const path = require('path');
const fs = require('fs');
const store = require('../data/store');
const persistence = require('../data/persistence');

const uploadDir = path.join(__dirname, '../uploads/images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 上传图片
async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未上传图片' });
    }
    
    console.log('收到图片上传请求:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
    
    // 存储图片元数据
    const image = {
      id: Date.now().toString(),
      filename: req.file.filename,
      originalname: req.file.originalname,
      uploader: req.user.username,
      uploadTime: new Date().toISOString(),
      mimetype: req.file.mimetype,
      size: req.file.size,
      roomId: req.body.roomId || 'default'
    };
    
    // 添加到内存存储
    store.addImage(image);
    
    // 持久化到文件系统
    try {
      persistence.images.add(image);
    } catch (persistError) {
      console.error('图片持久化失败:', persistError);
      // 继续执行，不因为持久化失败而中断上传
    }
    
    // 返回图片URL
    const imageUrl = `/uploads/images/${req.file.filename}`;
    
    console.log('图片上传成功:', imageUrl);
    
    res.status(201).json({ 
      status: 'ok', 
      image,
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('图片上传错误:', error);
    res.status(500).json({ error: '图片上传失败: ' + error.message });
  }
}

// 展示图片
async function getImage(req, res) {
  try {
    const imageId = req.params.imageId;
    console.log('请求图片:', imageId);
    
    const image = store.getImageById(imageId);
    if (!image) {
      console.log('图片不存在:', imageId);
      return res.status(404).json({ error: '图片不存在' });
    }
    
    const filePath = path.join(uploadDir, image.filename);
    if (!fs.existsSync(filePath)) {
      console.log('图片文件不存在:', filePath);
      return res.status(404).json({ error: '文件不存在' });
    }
    
    console.log('返回图片:', filePath);
    res.sendFile(filePath);
  } catch (error) {
    console.error('获取图片错误:', error);
    res.status(500).json({ error: '获取图片失败: ' + error.message });
  }
}

// 下载图片
async function downloadImage(req, res) {
  try {
    const imageId = req.params.imageId;
    const image = store.getImageById(imageId);
    if (!image) return res.status(404).json({ error: '图片不存在' });
    
    const filePath = path.join(uploadDir, image.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件不存在' });
    
    res.download(filePath, image.originalname);
  } catch (error) {
    console.error('下载图片错误:', error);
    res.status(500).json({ error: '下载图片失败: ' + error.message });
  }
}

module.exports = {
  uploadImage,
  getImage,
  downloadImage
}; 