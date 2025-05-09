// 添加认证头
export function addAuthHeader(headers = {}) {
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// 错误处理
export function handleError(error) {
  console.error('错误:', error);
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = error.message || '发生错误';
  document.body.appendChild(errorDiv);
  
  // 3秒后移除错误消息
  setTimeout(() => {
    errorDiv.remove();
  }, 3000);
}

// 全局错误处理
window.onerror = function(message, source, lineno, colno, error) {
  console.error('全局错误:', error);
  handleError(error);
};