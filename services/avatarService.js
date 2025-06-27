// 统一的头像服务
class AvatarService {
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
  static generateRoleBasedAvatar(name, role, size = 40) {
    const roleColors = {
      'sys': 'dc3545',      // 系统管理员 - 红色
      'admin': 'fd7e14',    // 管理员 - 橙色
      'host': '007bff',     // 主持人 - 蓝色
      'judge': '6f42c1',    // 评委 - 紫色
      'delegate': '28a745', // 代表 - 绿色
      'observer': '6c757d', // 观察者 - 灰色
      'student': '17a2b8'   // 学生 - 青色
    };
    
    const background = roleColors[role] || '007bff';
    return this.generateAvatarUrl(name, size, background, 'fff');
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
}

module.exports = AvatarService; 