const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const avatarService = require('./avatarService');

class UserProfileService {
    constructor() {
        this.usersDir = path.join(__dirname, '../data_files/users');
        this.usersFile = path.join(this.usersDir, 'users.json');
        
        // 确保目录存在
        if (!fs.existsSync(this.usersDir)) {
            fs.mkdirSync(this.usersDir, { recursive: true });
        }
        
        // 初始化用户文件
        this.initializeUsersFile();
    }

    // 初始化用户文件
    initializeUsersFile() {
        const credFile = path.join(__dirname, '../data_files/users.json');
        let profiles = [];

        if (fs.existsSync(this.usersFile)) {
            try {
                profiles = JSON.parse(fs.readFileSync(this.usersFile, 'utf8'));
            } catch (err) {
                console.error('读取用户档案失败:', err);
            }
        }

        if (fs.existsSync(credFile)) {
            try {
                const creds = JSON.parse(fs.readFileSync(credFile, 'utf8'));
                creds.forEach(u => {
                    if (!profiles.find(p => p.userId === u.userId)) {
                        profiles.push({
                            userId: u.userId,
                            username: u.username,
                            role: u.role,
                            email: `${u.username}@example.com`,
                            country: '中国',
                            avatar: null,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        });
                    }
                });
            } catch (err) {
                console.error('同步用户档案失败:', err);
            }
        }

        fs.writeFileSync(this.usersFile, JSON.stringify(profiles, null, 2));
    }

    // 获取所有用户
    getAllUsers() {
        try {
            const data = fs.readFileSync(this.usersFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('读取用户文件失败:', error);
            return [];
        }
    }

    // 根据ID获取用户
    getUserById(userId) {
        const users = this.getAllUsers();
        return users.find(user => user.userId === userId);
    }

    // 根据用户名获取用户
    getUserByUsername(username) {
        const users = this.getAllUsers();
        return users.find(user => user.username === username);
    }

    // 创建新用户
    createUser(userData) {
        const users = this.getAllUsers();
        const newUser = {
            userId: userData.userId || uuidv4(),
            username: userData.username,
            role: userData.role || 'observer',
            email: userData.email || '',
            country: userData.country || '中国',
            avatar: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        users.push(newUser);
        this.saveUsers(users);
        return newUser;
    }

    // 更新用户信息
    updateUser(userId, updates) {
        const users = this.getAllUsers();
        const userIndex = users.findIndex(user => user.userId === userId);
        
        if (userIndex !== -1) {
            users[userIndex] = {
                ...users[userIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveUsers(users);
            return users[userIndex];
        }
        
        return null;
    }

    // 更新用户头像
    updateUserAvatar(userId, avatarUrl) {
        return this.updateUser(userId, { avatar: avatarUrl });
    }

    // 删除用户
    deleteUser(userId) {
        const users = this.getAllUsers();
        const filteredUsers = users.filter(user => user.userId !== userId);
        
        if (filteredUsers.length !== users.length) {
            this.saveUsers(filteredUsers);
            // 删除用户头像文件
            avatarService.deleteUserAvatar(userId);
            return true;
        }
        
        return false;
    }

    // 保存用户数据
    saveUsers(users) {
        try {
            fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2));
            return true;
        } catch (error) {
            console.error('保存用户文件失败:', error);
            return false;
        }
    }

    // 获取用户完整信息（包括头像URL）
    getUserProfile(userId) {
        const user = this.getUserById(userId);
        if (!user) return null;

        return {
            ...user,
            avatarUrl: avatarService.getUserAvatarUrl(user.userId, user.username, user.role)
        };
    }
}

module.exports = new UserProfileService(); 