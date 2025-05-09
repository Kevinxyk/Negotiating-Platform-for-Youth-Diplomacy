// 示例：切换选项卡
const tabs = document.querySelectorAll('.tabs button');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});