// 导入配置和工具函数
import { currentConfig } from './config.js';
import { addAuthHeader, handleError } from './utils.js';

window.WS_URL = currentConfig.wsUrl;
window.API_BASE_URL = currentConfig.apiUrl;

// 全局变量
let ws = null;

// 麦克风和摄像头状态
let micOn = true;
let camOn = false;

// 录音按钮交互
let recording = false;
const recordBtn = document.getElementById('recordBtn');
if (recordBtn) {
  recordBtn.onclick = function() {
    recording = !recording;
    const icon = this.querySelector('.icon');
    const label = this.querySelector('.label');
    if (recording) {
      if (icon) icon.textContent = '⏺';
      if (label) label.textContent = '录音中';
      this.style.background = '#ff3b30';
      this.style.color = '#fff';
      this.style.fontWeight = 'bold';
    } else {
      if (icon) icon.textContent = '⏺';
      if (label) label.textContent = '录音';
      this.style.background = '#f4f8ff';
      this.style.color = '#3478f6';
      this.style.fontWeight = 'normal';
    }
  };
}

// 初始化WebSocket连接
function initWebSocket() {
  ws = new WebSocket(`${window.WS_URL}/ws?roomId=${window.roomId}`);
  
  ws.onopen = () => {
    console.log('WebSocket连接已建立');
    showMessage('系统', '已连接到聊天室');
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleWebSocketMessage(data);
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket错误:', error);
    handleError(error);
  };
  
  ws.onclose = () => {
    console.log('WebSocket连接已关闭');
    showMessage('系统', '连接已断开，正在重新连接...');
    setTimeout(initWebSocket, 3000);
  };
}

// 处理WebSocket消息
function handleWebSocketMessage(data) {
  switch(data.type) {
    case 'chat':
      showMessage(data.sender, data.content);
      break;
    case 'system':
      showMessage('系统', data.content);
      break;
    default:
      console.warn('未知消息类型:', data.type);
  }
}

// 显示消息
function showMessage(sender, content, status = 'success') {
  const chatBox = document.getElementById('chatBox');
  const p = document.createElement('p');
  p.classList.add(sender === window.currentUser ? 'me' : 'other');
  
  // 添加消息状态样式
  if (status === 'sending') {
    p.classList.add('sending');
  } else if (status === 'error') {
    p.classList.add('error');
  }
  
  p.innerHTML = `
    <strong>${sender}</strong>
    <span class="message-content">${content}</span>
    ${status === 'sending' ? '<span class="sending-indicator">...</span>' : ''}
  `;
  
  chatBox.appendChild(p);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// 发送消息
async function sendMsg() {
  const input = document.getElementById('chatInput');
  const chatBox = document.getElementById('chatBox');
  const value = input.value.trim();
  
  if (value) {
    try {
      // 显示发送中的消息
      showMessage(window.currentUser, value, 'sending');
      input.value = '';
      
      // 发送到服务器
      const headers = addAuthHeader({
        'Content-Type': 'application/json'
      });
      
      const response = await fetch(`${window.API_BASE_URL}/chat/${window.roomId}/send`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: value,
          sender: window.currentUser
        })
      });
      
      if (!response.ok) {
        throw new Error('发送消息失败');
      }
      
      // 更新消息状态为成功
      const lastMessage = chatBox.lastElementChild;
      if (lastMessage) {
        lastMessage.classList.remove('sending');
        lastMessage.classList.add('success');
        lastMessage.querySelector('.sending-indicator')?.remove();
      }
    } catch (error) {
      handleError(error);
      // 更新消息状态为错误
      const lastMessage = chatBox.lastElementChild;
      if (lastMessage) {
        lastMessage.classList.remove('sending');
        lastMessage.classList.add('error');
        lastMessage.querySelector('.sending-indicator')?.remove();
      }
    }
  }
}

// 加载聊天历史
async function loadChatHistory() {
  try {
    const chatBox = document.getElementById('chatBox');
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.textContent = '加载中...';
    chatBox.appendChild(loadingIndicator);
    
    const headers = addAuthHeader({});
    const response = await fetch(`${window.API_BASE_URL}/chat/${window.roomId}/messages?limit=50&offset=0`, { headers });
    const messages = await response.json();
    
    loadingIndicator.remove();
    chatBox.innerHTML = '';
    
    if (Array.isArray(messages)) {
      messages.forEach(msg => {
        showMessage(msg.username || msg.sender, msg.text || msg.content);
      });
    } else {
      console.error('消息数据格式错误', messages);
    }
  } catch (error) {
    handleError(error);
  }
}

// 切换麦克风
async function toggleMic() {
  const micBtn = document.getElementById('micBtn');
  const icon = micBtn.querySelector('.icon');
  const label = micBtn.querySelector('.label');
  
  try {
    const headers = addAuthHeader({
      'Content-Type': 'application/json'
    });
    
    const response = await fetch(`${window.API_BASE_URL}/audio/${window.roomId}/control`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: label.textContent === '麦克风' ? 'mute' : 'unmute'
      })
    });
    
    if (response.ok) {
      if (label.textContent === '麦克风') {
        icon.textContent = '❌';
        label.textContent = '关闭麦克风';
      } else {
        icon.textContent = '🎤';
        label.textContent = '麦克风';
      }
    }
  } catch (error) {
    handleError(error);
  }
}

// 切换摄像头
async function toggleCamera() {
  const camBtn = document.getElementById('camBtn');
  const icon = camBtn.querySelector('.icon');
  const label = camBtn.querySelector('.label');
  
  try {
    const headers = addAuthHeader({
      'Content-Type': 'application/json'
    });
    
    const response = await fetch(`${window.API_BASE_URL}/video/${window.roomId}/control`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: label.textContent === '摄像头' ? 'off' : 'on'
      })
    });
    
    if (response.ok) {
      if (label.textContent === '摄像头') {
        icon.textContent = '✖';
        label.textContent = '关闭摄像头';
      } else {
        icon.textContent = '📹';
        label.textContent = '摄像头';
      }
    }
  } catch (error) {
    handleError(error);
  }
}

// 切换全屏
function toggleFullscreen() {
  const scr = document.querySelector('.screen');
  if (!document.fullscreenElement) {
    scr.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

// 加载参会者列表（静态渲染）
async function loadParticipants() {
  // 静态内容
  const talkList = document.querySelector('.talk-list');
  talkList.innerHTML = `
    <li class="talk-item">
      <img src="https://randomuser.me/api/portraits/men/11.jpg" class="avatar" />
      <div class="talk-info">
        <strong>本尼 · m · 兰德里</strong>
        <span class="email">BennyMLandry@rhyta.com</span>
      </div>
      <div class="talk-status">
        <span class="icon mic-on">🎤</span>
      </div>
    </li>
    <li class="talk-item">
      <img src="https://randomuser.me/api/portraits/women/12.jpg" class="avatar" />
      <div class="talk-info">
        <strong>艾伯特 · c · 罗伯茨</strong>
        <span class="email">ertCRoberts@dayrep.com</span>
      </div>
      <div class="talk-status">
        <span class="icon mic-off">🔇</span>
      </div>
    </li>
    <li class="talk-item">
      <img src="https://randomuser.me/api/portraits/men/13.jpg" class="avatar" />
      <div class="talk-info">
        <strong>斯坦利 · a · 巴克利</strong>
        <span class="email">StanleyABuckley@jourrapide.com</span>
      </div>
      <div class="talk-status">
        <span class="icon mic-on">🎤</span>
      </div>
    </li>
  `;
  // 静态数量
  document.getElementById('participantCount').textContent = 28;
}

// 初始化音量控制
function initVolumeControl() {
  const volumeSlider = document.querySelector('.volume-slider');
  const volumeKnob = document.querySelector('.volume-knob');
  let isDragging = false;
  
  volumeKnob.addEventListener('mousedown', () => {
    isDragging = true;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const rect = volumeSlider.getBoundingClientRect();
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      const volume = 1 - (y / rect.height);
      volumeKnob.style.top = `${y}px`;
      // 发送音量更新到服务器
      updateVolume(volume);
    }
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

// 更新音量
async function updateVolume(volume) {
  try {
    const headers = addAuthHeader({
      'Content-Type': 'application/json'
    });
    
    await fetch(`${window.API_BASE_URL}/audio/${window.roomId}/volume`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ volume })
    });
  } catch (error) {
    handleError(error);
  }
}

// 初始化
async function initialize() {
  // 初始化WebSocket
  initWebSocket();
  
  // 加载初始数据
  await loadChatHistory();
  await loadParticipants();
  
  // 初始化音量控制
  initVolumeControl();
  
  // 设置定时刷新
  setInterval(loadParticipants, 5000);
  setInterval(loadChatHistory, 3000);
  
  // 绑定事件处理函数
  document.getElementById('fullscreenBtn').onclick = toggleFullscreen;
  
  // 绑定回车发送
  document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMsg();
    }
  });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initialize);

// 导出函数供HTML使用
window.sendMsg = sendMsg;

// 绑定麦克风按钮交互
const micBtn = document.getElementById('micBtn');
if (micBtn) {
  micBtn.onclick = function() {
    micOn = !micOn;
    const icon = this.querySelector('.icon');
    const label = this.querySelector('.label');
    if (micOn) {
      if (icon) icon.textContent = '🎤';
      if (label) label.textContent = '麦克风已开';
      this.style.color = '#3478f6';
    } else {
      if (icon) icon.textContent = '🔇';
      if (label) label.textContent = '麦克风已关';
      this.style.color = '#bbb';
    }
  };
}

// 绑定摄像头按钮交互
const camBtn = document.getElementById('camBtn');
if (camBtn) {
  camBtn.onclick = function() {
    camOn = !camOn;
    const icon = this.querySelector('.icon');
    const label = this.querySelector('.label');
    if (camOn) {
      if (icon) icon.textContent = '📹';
      if (label) label.textContent = '摄像头已开';
      this.style.color = '#ff9500';
    } else {
      if (icon) icon.textContent = '✖';
      if (label) label.textContent = '摄像头已关';
      this.style.color = '#bbb';
    }
  };
}

// 全屏适配：监听全屏切换，动态加/去 .fullscreen class
const screen = document.querySelector('.screen');
document.addEventListener('fullscreenchange', function() {
  if (document.fullscreenElement && screen) {
    screen.classList.add('fullscreen');
  } else if (screen) {
    screen.classList.remove('fullscreen');
  }
});

// ====== 时间倒计时和评分展示栏逻辑 ======
const eventId = window.roomId; // 假设roomId即为eventId
let timerInterval = null;
let remainingSeconds = 0;

async function fetchTimeState() {
  try {
    console.log('正在获取时间状态...');
    const res = await fetch(`${window.API_BASE_URL}/time/${eventId}/state`, { 
      headers: addAuthHeader({}) 
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    console.log('获取到时间状态:', data);
    remainingSeconds = data.remainingSeconds || 0;
    updateTimerDisplay();
  } catch (e) {
    console.error('获取时间状态失败:', e);
    handleError(e);
  }
}

function updateTimerDisplay() {
  const min = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const sec = String(remainingSeconds % 60).padStart(2, '0');
  const timerValue = document.getElementById('timer-value');
  if (timerValue) {
    timerValue.textContent = `${min}:${sec}`;
    console.log('更新倒计时显示:', `${min}:${sec}`);
  } else {
    console.error('找不到倒计时显示元素');
  }
}

function startTimer() {
  console.log('启动倒计时...');
  if (timerInterval) {
    console.log('清除现有定时器');
    clearInterval(timerInterval);
  }
  timerInterval = setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      updateTimerDisplay();
    } else {
      console.log('倒计时结束');
      clearInterval(timerInterval);
    }
  }, 1000);
}

document.getElementById('pauseBtn').onclick = async function() {
  try {
    console.log('暂停倒计时...');
    const res = await fetch(`${window.API_BASE_URL}/time/${eventId}/pause`, { 
      method: 'POST', 
      headers: addAuthHeader({}) 
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    clearInterval(timerInterval);
    this.style.display = 'none';
    document.getElementById('resumeBtn').style.display = '';
    console.log('倒计时已暂停');
  } catch (e) {
    console.error('暂停倒计时失败:', e);
    handleError(e);
  }
};

document.getElementById('resumeBtn').onclick = async function() {
  try {
    console.log('恢复倒计时...');
    const res = await fetch(`${window.API_BASE_URL}/time/${eventId}/resume`, { 
      method: 'POST', 
      headers: addAuthHeader({}) 
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    startTimer();
    this.style.display = 'none';
    document.getElementById('pauseBtn').style.display = '';
    console.log('倒计时已恢复');
  } catch (e) {
    console.error('恢复倒计时失败:', e);
    handleError(e);
  }
};

// 初始化倒计时
fetchTimeState().then(startTimer);

// ====== 评分展示栏逻辑 ======
async function fetchScore() {
  try {
    const res = await fetch(`${window.API_BASE_URL}/score/${window.roomId}`, { headers: addAuthHeader({}) });
    const data = await res.json();
    document.getElementById('total-score').textContent = data.total || 0;
  } catch (e) {}
}

async function fetchRanking() {
  try {
    const res = await fetch(`${window.API_BASE_URL}/score/${window.roomId}/ranking`, { headers: addAuthHeader({}) });
    const data = await res.json();
    document.getElementById('ranking').textContent = data.ranking || '-';
  } catch (e) {}
}

fetchScore();
fetchRanking();