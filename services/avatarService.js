const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 统一的头像服务
class AvatarService {
  constructor() {
    this.avatarDir = path.join(__dirname, '../uploads/avatars');
    this.defaultAvatarDir = path.join(__dirname, '../public/assets/avatars');
    
    // 确保目录存在
    if (!fs.existsSync(this.avatarDir)) {
      fs.mkdirSync(this.avatarDir, { recursive: true });
    }
    if (!fs.existsSync(this.defaultAvatarDir)) {
      fs.mkdirSync(this.defaultAvatarDir, { recursive: true });
    }
  }

  /**
   * 生成用户头像URL
   * @param {string} name - 用户名
   * @param {number} size - 头像尺寸，默认40
   * @param {string} background - 背景色，默认007bff
   * @param {string} color - 文字颜色，默认fff
   * @returns {string} 头像URL
   */
  static generateAvatarUrl(name, size = 40, background = '007bff', color = 'fff') {
    if (!name || name.trim() === '') {
      return `https://ui-avatars.com/api/?name=U&background=${background}&color=${color}&size=${size}`;
    }
    
    // 清理用户名，移除特殊字符
    const cleanName = name.trim().replace(/[^\w\s\u4e00-\u9fff]/g, '');
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=${background}&color=${color}&size=${size}`;
  }

  /**
   * 根据用户角色生成不同颜色的头像
   * @param {string} name - 用户名
   * @param {string} role - 用户角色
   * @param {number} size - 头像尺寸
   * @returns {string} 头像URL
   */
  generateRoleBasedAvatar(username, role, size = 40) {
    const roleColors = {
      'admin': '#ff4757',
      'host': '#2ed573',
      'sys': '#1e90ff',
      'student': '#ffa502',
      'observer': '#747d8c',
      'judge': '#ff6348',
      'delegate': '#5352ed'
    };
    
    const color = roleColors[role] || '#747d8c';
    const initials = username.substring(0, 2).toUpperCase();
    
    // 生成SVG头像
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${color}"/>
        <text x="${size/2}" y="${size/2 + size/8}" 
              font-family="Arial, sans-serif" 
              font-size="${size/3}" 
              fill="white" 
              text-anchor="middle" 
              dominant-baseline="middle">${initials}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  /**
   * 生成默认头像
   * @param {number} size - 头像尺寸
   * @returns {string} 默认头像URL
   */
  static getDefaultAvatar(size = 40) {
    return this.generateAvatarUrl('U', size, '007bff', 'fff');
  }

  /**
   * 验证头像URL是否有效
   * @param {string} url - 头像URL
   * @returns {boolean} 是否有效
   */
  static isValidAvatarUrl(url) {
    if (!url) return false;
    
    // 检查是否是ui-avatars.com的URL
    if (url.includes('ui-avatars.com')) {
      return true;
    }
    
    // 检查是否是有效的图片URL
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  // 获取用户头像URL
  getUserAvatarUrl(userId, username, role) {
    const avatarPath = path.join(this.avatarDir, `${userId}.jpg`);
    
    if (fs.existsSync(avatarPath)) {
      return `/uploads/avatars/${userId}.jpg`;
    }
    
    // 如果没有自定义头像，返回默认头像
    return this.generateRoleBasedAvatar(username, role);
  }

  // 保存用户头像
  saveUserAvatar(userId, imageBuffer) {
    const avatarPath = path.join(this.avatarDir, `${userId}.jpg`);
    fs.writeFileSync(avatarPath, imageBuffer);
    return `/uploads/avatars/${userId}.jpg`;
  }

  // 删除用户头像
  deleteUserAvatar(userId) {
    const avatarPath = path.join(this.avatarDir, `${userId}.jpg`);
    if (fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
      return true;
    }
    return false;
  }

  // 检查用户是否有自定义头像
  hasCustomAvatar(userId) {
    const avatarPath = path.join(this.avatarDir, `${userId}.jpg`);
    return fs.existsSync(avatarPath);
  }
}

module.exports = new AvatarService(); 