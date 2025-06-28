// auth.js - 认证和权限管理
window.auth = {
  // 检查用户是否已登录
  checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      this.showLoginRequired();
      return false;
    }
    
    try {
      // 检查token是否过期 (JWT格式：header.payload.signature)
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.showLoginRequired();
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('Token validation error:', e);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.showLoginRequired();
      return false;
    }
  },
  
  // 检查用户是否有特定角色
  checkRole(allowedRoles) {
    if (!this.checkAuth()) return false;
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return allowedRoles.includes(user.role);
    } catch (e) {
      console.error('Role check error:', e);
      return false;
    }
  },
  
  // 显示登录提示
  showLoginRequired() {
    const loginPrompt = document.createElement('div');
    loginPrompt.className = 'alert alert-warning fixed-top m-3';
    loginPrompt.style.zIndex = '9999';
    loginPrompt.innerHTML = `
      <h4>请先登录</h4>
      <p>您需要登录后才能访问此页面。3秒后将跳转到登录页面。</p>
    `;
    document.body.appendChild(loginPrompt);
    
    setTimeout(() => {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
    }, 3000);
  },
  
  // 根据用户角色更新界面
  updateUIByRole() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // 隐藏对低权限用户的功能
      const adminOnlyElements = document.querySelectorAll('.admin-only');
      const hostOnlyElements = document.querySelectorAll('.host-only');
      const highRoleElements = document.querySelectorAll('.high-role-only'); // admin, host, sys
      
      // 设置显示/隐藏
      adminOnlyElements.forEach(el => {
        el.style.display = ['admin', 'sys'].includes(user.role) ? '' : 'none';
      });
      
      hostOnlyElements.forEach(el => {
        el.style.display = ['host', 'admin', 'sys'].includes(user.role) ? '' : 'none';
      });
      
      highRoleElements.forEach(el => {
        el.style.display = ['host', 'admin', 'sys', 'delegate'].includes(user.role) ? '' : 'none';
      });
      
      // 如果房间有创建者信息，检查当前用户是否是创建者
      const roomCreatorElements = document.querySelectorAll('.room-creator-only');
      if (roomCreatorElements.length > 0) {
        this.getRoomData().then(room => {
          const isCreator = room && room.createdBy === user.userId;
          roomCreatorElements.forEach(el => {
            el.style.display = isCreator ? '' : 'none';
          });
        }).catch(err => console.error('Error checking room creator:', err));
      }
      
    } catch (e) {
      console.error('UI update error:', e);
    }
  },
  
  // 获取当前房间数据
  async getRoomData() {
    const parts = window.location.pathname.split('/');
    const roomId = parts[2]; // /rooms/:id
    
    if (!roomId) return null;
    
    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        credentials: 'include'
      });
      
      if (!res.ok) return null;
      
      return await res.json();
    } catch (e) {
      console.error('Error fetching room data:', e);
      return null;
    }
  },
  
  // 获取用户信息
  getUserInfo() {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (e) {
      console.error('Error getting user info:', e);
      return {};
    }
  },
  
  // 登录
  async login(username, password) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '登录失败');
      }
      
      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return true;
    } catch (e) {
      console.error('Login error:', e);
      throw e;
    }
  },
  
  // 注销
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}; 