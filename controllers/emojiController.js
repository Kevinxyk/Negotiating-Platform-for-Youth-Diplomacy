const store = require('../data/store');

// 预定义表情列表
const emojiList = [
  { id: 'smile', emoji: '😊', name: '微笑', category: 'face' },
  { id: 'laugh', emoji: '😄', name: '大笑', category: 'face' },
  { id: 'wink', emoji: '😉', name: '眨眼', category: 'face' },
  { id: 'cry', emoji: '😢', name: '哭泣', category: 'face' },
  { id: 'angry', emoji: '😠', name: '生气', category: 'face' },
  { id: 'surprise', emoji: '😲', name: '惊讶', category: 'face' },
  { id: 'cool', emoji: '😎', name: '酷', category: 'face' },
  { id: 'love', emoji: '😍', name: '爱心', category: 'face' },
  { id: 'thumbsup', emoji: '👍', name: '点赞', category: 'gesture' },
  { id: 'thumbsdown', emoji: '👎', name: '点踩', category: 'gesture' },
  { id: 'clap', emoji: '👏', name: '鼓掌', category: 'gesture' },
  { id: 'wave', emoji: '👋', name: '挥手', category: 'gesture' },
  { id: 'ok', emoji: '👌', name: 'OK', category: 'gesture' },
  { id: 'victory', emoji: '✌️', name: '胜利', category: 'gesture' },
  { id: 'heart', emoji: '❤️', name: '红心', category: 'symbol' },
  { id: 'star', emoji: '⭐', name: '星星', category: 'symbol' },
  { id: 'fire', emoji: '🔥', name: '火焰', category: 'symbol' },
  { id: 'lightning', emoji: '⚡', name: '闪电', category: 'symbol' },
  { id: 'check', emoji: '✅', name: '对勾', category: 'symbol' },
  { id: 'cross', emoji: '❌', name: '叉号', category: 'symbol' },
  { id: 'question', emoji: '❓', name: '问号', category: 'symbol' },
  { id: 'exclamation', emoji: '❗', name: '感叹号', category: 'symbol' },
  { id: 'rocket', emoji: '🚀', name: '火箭', category: 'object' },
  { id: 'trophy', emoji: '🏆', name: '奖杯', category: 'object' },
  { id: 'crown', emoji: '👑', name: '皇冠', category: 'object' },
  { id: 'gift', emoji: '🎁', name: '礼物', category: 'object' },
  { id: 'balloon', emoji: '🎈', name: '气球', category: 'object' },
  { id: 'party', emoji: '🎉', name: '庆祝', category: 'object' },
  { id: 'music', emoji: '🎵', name: '音乐', category: 'object' },
  { id: 'coffee', emoji: '☕', name: '咖啡', category: 'food' },
  { id: 'pizza', emoji: '🍕', name: '披萨', category: 'food' },
  { id: 'cake', emoji: '🎂', name: '蛋糕', category: 'food' },
  { id: 'beer', emoji: '🍺', name: '啤酒', category: 'food' },
  { id: 'wine', emoji: '🍷', name: '红酒', category: 'food' }
];

// 获取表情列表
async function getEmojiList(req, res) {
  const { category } = req.query;
  
  if (category) {
    const filteredEmojis = emojiList.filter(emoji => emoji.category === category);
    res.json({ status: 'ok', emojis: filteredEmojis });
  } else {
    res.json({ status: 'ok', emojis: emojiList });
  }
}

// 获取表情分类
async function getEmojiCategories(req, res) {
  const categories = [...new Set(emojiList.map(emoji => emoji.category))];
  res.json({ status: 'ok', categories });
}

// 处理表情消息
async function processEmojiMessage(content) {
  // 检查是否包含表情代码（如 :smile:）
  const emojiPattern = /:([a-zA-Z]+):/g;
  let processedContent = content;
  let match;
  
  while ((match = emojiPattern.exec(content)) !== null) {
    const emojiCode = match[1];
    const emoji = emojiList.find(e => e.id === emojiCode);
    if (emoji) {
      processedContent = processedContent.replace(match[0], emoji.emoji);
    }
  }
  
  return processedContent;
}

// 获取表情统计（用户最常用的表情）
async function getEmojiStats(req, res) {
  const { roomId } = req.params;
  const messages = store.getMessages(roomId) || [];
  
  const emojiStats = {};
  
  messages.forEach(message => {
    if (message.content) {
      emojiList.forEach(emoji => {
        const count = (message.content.match(new RegExp(emoji.emoji, 'g')) || []).length;
        if (count > 0) {
          emojiStats[emoji.id] = (emojiStats[emoji.id] || 0) + count;
        }
      });
    }
  });
  
  // 转换为数组并排序
  const sortedStats = Object.entries(emojiStats)
    .map(([id, count]) => {
      const emoji = emojiList.find(e => e.id === id);
      return {
        id,
        emoji: emoji.emoji,
        name: emoji.name,
        count
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // 只返回前10个最常用的表情
  
  res.json({ status: 'ok', stats: sortedStats });
}

module.exports = {
  getEmojiList,
  getEmojiCategories,
  processEmojiMessage,
  getEmojiStats
}; 