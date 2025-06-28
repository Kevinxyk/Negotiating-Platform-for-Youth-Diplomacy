/**
 * 数据持久化模块 - 用于在文件系统中保存和读取数据
 */
const fs = require('fs');
const path = require('path');

// 数据文件路径
const DATA_DIR = path.join(__dirname, '../data_files');
const FILES = {
  USERS: path.join(DATA_DIR, 'users.json'),
  ROOMS: path.join(DATA_DIR, 'rooms.json'),
  MESSAGES: path.join(DATA_DIR, 'messages.json'),
  SCORES: path.join(DATA_DIR, 'scores.json'),
  SETTINGS: path.join(DATA_DIR, 'settings.json'),
  IMAGES: path.join(DATA_DIR, 'images.json')
};

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 创建默认的空数据文件
Object.values(FILES).forEach(file => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify([]));
  }
});

/**
 * 从文件中读取数据
 * @param {string} file - 文件路径
 * @returns {Array|Object} - 读取的数据
 */
function readData(file) {
  try {
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading data from ${file}:`, error);
    // 出错时返回空数组或对象
    return path.basename(file) === 'settings.json' ? {} : [];
  }
}

/**
 * 将数据写入文件
 * @param {string} file - 文件路径
 * @param {Array|Object} data - 要写入的数据
 * @returns {boolean} - 是否成功
 */
function writeData(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing data to ${file}:`, error);
    return false;
  }
}

// 新增：确保房间目录存在
function ensureRoomDir(roomId) {
  const roomDir = path.join(DATA_DIR, 'rooms', String(roomId));
  if (!fs.existsSync(roomDir)) {
    fs.mkdirSync(roomDir, { recursive: true });
  }
  return roomDir;
}

// 新增：获取房间下的文件路径
function getRoomFile(roomId, type) {
  const roomDir = ensureRoomDir(roomId);
  return path.join(roomDir, `${type}.json`);
}

/**
 * 数据持久化对象
 */
const persistence = {
  // 用户数据操作
  users: {
    // 获取所有用户
    getAll() {
      return readData(FILES.USERS);
    },
    
    // 通过ID获取用户
    getById(userId) {
      const users = this.getAll();
      return users.find(user => user.userId === userId);
    },
    
    // 通过用户名获取用户
    // 注意：仅用于展示/兼容，主链路请全部用 userId，userId/username 互查请用 userService 的 getUsernameById/getUserIdByUsername
    getByUsername(username) {
      const users = this.getAll();
      return users.find(user => user.username === username);
    },
    
    // 添加新用户
    add(user) {
      const users = this.getAll();
      users.push(user);
      return writeData(FILES.USERS, users) ? user : null;
    },
    
    // 更新用户
    update(userId, updates) {
      const users = this.getAll();
      const index = users.findIndex(user => user.userId === userId);
      
      if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        return writeData(FILES.USERS, users) ? users[index] : null;
      }
      
      return null;
    },
    
    // 删除用户
    remove(userId) {
      const users = this.getAll();
      const filteredUsers = users.filter(user => user.userId !== userId);
      
      if (filteredUsers.length < users.length) {
        return writeData(FILES.USERS, filteredUsers);
      }
      
      return false;
    }
  },
  
  // 房间数据操作
  rooms: {
    // 获取所有房间（只返回房间基本信息，不含子数据）
    getAll() {
      const roomsRoot = path.join(DATA_DIR, 'rooms');
      if (!fs.existsSync(roomsRoot)) return [];
      const roomIds = fs.readdirSync(roomsRoot).filter(f => fs.statSync(path.join(roomsRoot, f)).isDirectory());
      return roomIds.map(roomId => {
        const metaFile = getRoomFile(roomId, 'meta');
        if (fs.existsSync(metaFile)) {
          return { ...JSON.parse(fs.readFileSync(metaFile, 'utf8')), id: roomId };
        } else {
          return { id: roomId };
        }
      });
    },
    // 通过ID获取房间
    getById(roomId) {
      const metaFile = getRoomFile(roomId, 'meta');
      if (fs.existsSync(metaFile)) {
        return { ...JSON.parse(fs.readFileSync(metaFile, 'utf8')), id: roomId };
      }
      return null;
    },
    // 通过邀请码获取房间
    getByInviteCode(inviteCode) {
      const rooms = this.getAll();
      return rooms.find(room => room.inviteCode === inviteCode);
    },
    // 添加新房间
    add(room) {
      const roomId = room.id || String(Date.now());
      ensureRoomDir(roomId);
      const metaFile = getRoomFile(roomId, 'meta');
      fs.writeFileSync(metaFile, JSON.stringify(room, null, 2), 'utf8');
      return { ...room, id: roomId };
    },
    // 更新房间
    update(roomId, updates) {
      const metaFile = getRoomFile(roomId, 'meta');
      let data = {};
      if (fs.existsSync(metaFile)) {
        data = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
      }
      const newData = { ...data, ...updates };
      fs.writeFileSync(metaFile, JSON.stringify(newData, null, 2), 'utf8');
      return { ...newData, id: roomId };
    },
    // 删除房间
    remove(roomId) {
      const roomDir = path.join(DATA_DIR, 'rooms', String(roomId));
      if (fs.existsSync(roomDir)) {
        fs.rmSync(roomDir, { recursive: true, force: true });
        return true;
      }
      return false;
    },
    // ========== 房间子数据 ===========
    getRoomData(roomId, type) {
      const file = getRoomFile(roomId, type);
      if (!fs.existsSync(file)) return [];
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    },
    setRoomData(roomId, type, data) {
      const file = getRoomFile(roomId, type);
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
      return true;
    },
  },
  
  // 消息数据操作
  messages: {
    // 获取所有消息
    getAll() {
      return readData(FILES.MESSAGES);
    },
    
    // 获取指定房间的消息
    getByRoom(roomId, limit = 50, offset = 0) {
      const messages = this.getAll();
      return messages
        .filter(msg => msg.room === roomId)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .slice(offset, offset + limit);
    },
    
    // 添加新消息
    add(message) {
      const messages = this.getAll();
      const newMessage = {
        ...message,
        id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        createdAt: message.createdAt || new Date().toISOString()
      };
      messages.push(newMessage);
      return writeData(FILES.MESSAGES, messages) ? newMessage : null;
    },
    
    // 更新消息
    update(messageId, updates) {
      const messages = this.getAll();
      const index = messages.findIndex(msg => msg.id === messageId);
      
      if (index !== -1) {
        messages[index] = { 
          ...messages[index], 
          ...updates,
          updatedAt: new Date().toISOString()
        };
        return writeData(FILES.MESSAGES, messages) ? messages[index] : null;
      }
      
      return null;
    },
    
    // 删除消息
    remove(messageId) {
      const messages = this.getAll();
      const filteredMessages = messages.filter(msg => msg.id !== messageId);
      
      if (filteredMessages.length < messages.length) {
        return writeData(FILES.MESSAGES, filteredMessages);
      }
      
      return false;
    }
  },
  
  // 评分数据操作
  scores: {
    // 获取所有评分
    getAll() {
      return readData(FILES.SCORES);
    },
    
    // 获取指定房间的评分
    getByRoom(roomId) {
      const scores = this.getAll();
      return scores.filter(score => score.room === roomId);
    },
    
    // 添加新评分
    add(score) {
      const scores = this.getAll();
      const newScore = {
        ...score,
        id: score.id || `score-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        createdAt: score.createdAt || new Date().toISOString()
      };
      scores.push(newScore);
      return writeData(FILES.SCORES, scores) ? newScore : null;
    }
  },
  
  // 应用设置操作
  settings: {
    // 获取所有设置
    getAll() {
      return readData(FILES.SETTINGS);
    },
    
    // 获取用户设置
    getUserSettings(userId) {
      const settings = this.getAll();
      return settings[userId] || {};
    },
    
    // 更新用户设置
    updateUserSettings(userId, updates) {
      const settings = this.getAll();
      settings[userId] = {
        ...(settings[userId] || {}),
        ...updates
      };
      return writeData(FILES.SETTINGS, settings) ? settings[userId] : null;
    }
  },
  
  // 图片数据操作
  images: {
    // 获取所有图片
    getAll() {
      return readData(FILES.IMAGES);
    },
    
    // 通过ID获取图片
    getById(imageId) {
      const images = this.getAll();
      return images.find(img => img.id === imageId);
    },
    
    // 通过房间ID获取图片
    getByRoom(roomId) {
      const images = this.getAll();
      return images.filter(img => img.roomId === roomId);
    },
    
    // 添加新图片
    add(image) {
      const images = this.getAll();
      const newImage = {
        ...image,
        id: image.id || `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        uploadTime: image.uploadTime || new Date().toISOString()
      };
      images.push(newImage);
      return writeData(FILES.IMAGES, images) ? newImage : null;
    },
    
    // 更新图片
    update(imageId, updates) {
      const images = this.getAll();
      const index = images.findIndex(img => img.id === imageId);
      
      if (index !== -1) {
        images[index] = { 
          ...images[index], 
          ...updates,
          updatedAt: new Date().toISOString()
        };
        return writeData(FILES.IMAGES, images) ? images[index] : null;
      }
      
      return null;
    },
    
    // 删除图片
    remove(imageId) {
      const images = this.getAll();
      const filteredImages = images.filter(img => img.id !== imageId);
      
      if (filteredImages.length < images.length) {
        return writeData(FILES.IMAGES, filteredImages);
      }
      
      return false;
    },
    
    // 保存图片数组
    save(images) {
      return writeData(FILES.IMAGES, images);
    }
  },
  
  // 加载初始数据
  loadInitialData(store) {
    // 加载用户数据
    const users = this.users.getAll();
    if (users.length > 0) {
      store.users = users;
    } else if (store.users.length > 0) {
      // 如果数据文件为空但内存中有数据，则保存到文件
      writeData(FILES.USERS, store.users);
    }
    
    // 加载房间数据
    const rooms = this.rooms.getAll();
    if (rooms.length > 0) {
      store.rooms = rooms;
    } else if (store.rooms.length > 0) {
      writeData(FILES.ROOMS, store.rooms);
    }
    
    // 加载消息数据
    const messages = this.messages.getAll();
    if (messages.length > 0) {
      store.messages = messages;
    } else if (store.messages.length > 0) {
      writeData(FILES.MESSAGES, store.messages);
    }
    
    // 加载评分数据
    const scores = this.scores.getAll();
    if (scores.length > 0) {
      store.scores = scores;
    } else if (store.scores.length > 0) {
      writeData(FILES.SCORES, store.scores);
    }
    
    // 加载图片数据
    const images = this.images.getAll();
    if (images.length > 0) {
      store.images = images;
    } else if (store.images.length > 0) {
      writeData(FILES.IMAGES, store.images);
    }
    
    console.log('数据加载完成');
    return store;
  },
  
  // 保存当前数据
  saveCurrentData(store) {
    writeData(FILES.USERS, store.users);
    writeData(FILES.ROOMS, store.rooms);
    writeData(FILES.MESSAGES, store.messages);
    writeData(FILES.SCORES, store.scores);
    writeData(FILES.IMAGES, store.images);
    console.log('数据已保存到文件系统');
    return true;
  },
  
  // 定期自动保存
  setupAutoSave(store, intervalMinutes = 5) {
    const intervalMs = intervalMinutes * 60 * 1000;
    
    // 设置定时器定期保存数据
    setInterval(() => {
      this.saveCurrentData(store);
    }, intervalMs);
    
    // 添加进程退出时保存数据
    process.on('SIGINT', () => {
      console.log('接收到终止信号，正在保存数据...');
      this.saveCurrentData(store);
      process.exit(0);
    });
    
    console.log(`自动保存已设置，每${intervalMinutes}分钟保存一次`);
  }
};

module.exports = persistence; 