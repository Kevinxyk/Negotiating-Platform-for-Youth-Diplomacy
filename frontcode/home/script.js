// 示例：轮播图自动滚动
let currentIndex = 0;
const items = document.querySelectorAll('.carousel-item');

function showNextItem() {
  items[currentIndex].classList.remove('active');
  currentIndex = (currentIndex + 1) % items.length;
  items[currentIndex].classList.add('active');
}

setInterval(showNextItem, 3000);