// chat.js
class Chat {
    constructor() {
      this.chatBox = document.getElementById('chatBox');
      this.chatInput = document.getElementById('chatInput');
      this.sendBtn = document.getElementById('sendBtn');
      this.chatCount = document.getElementById('chatCount');
      
      this.init();
    }
    
    init() {
      // 绑定发送按钮点击事件
      this.sendBtn.addEventListener('click', () => this.sendMessage());
      
      // 绑定回车发送
      this.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
    
    sendMessage() {
      const message = this.chatInput.value.trim();
      
      if (message) {
        // 创建消息元素
        const messageElement = document.createElement('p');
        messageElement.classList.add('me');
        messageElement.innerHTML = `<strong>我:</strong> ${message}`;
        
        // 添加到聊天框
        this.chatBox.appendChild(messageElement);
        
        // 清空输入框
        this.chatInput.value = '';
        
        // 滚动到底部
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
        
        // 更新消息计数
        this.updateMessageCount();
        
        // 这里可以添加发送到服务器的代码
        console.log('发送消息:', message);
      }
    }
    
    addMessage(sender, content) {
      const messageElement = document.createElement('p');
      messageElement.classList.add(sender === '我' ? 'me' : 'other');
      messageElement.innerHTML = `<strong>${sender}:</strong> ${content}`;
      
      this.chatBox.appendChild(messageElement);
      this.chatBox.scrollTop = this.chatBox.scrollHeight;
      this.updateMessageCount();
    }
    
    updateMessageCount() {
      const count = this.chatBox.children.length;
      this.chatCount.textContent = count;
    }
  }
  
  // 创建聊天实例
  const chat = new Chat();