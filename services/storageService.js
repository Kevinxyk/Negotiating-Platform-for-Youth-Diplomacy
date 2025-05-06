const messages = new Map();  // room -> messages[]
const scores = new Map();    // room -> scores[]

class StorageService {
  // Messages
  static getRoomMessages(room) {
    return messages.get(room) || [];
  }

  static addMessage(room, message) {
    if (!messages.has(room)) {
      messages.set(room, []);
    }
    messages.get(room).push(message);
  }

  static clearRoomMessages(room) {
    messages.delete(room);
  }

  // Scores
  static getRoomScores(room) {
    return scores.get(room) || [];
  }

  static addScore(room, score) {
    if (!scores.has(room)) {
      scores.set(room, []);
    }
    scores.get(room).push(score);
  }

  static clearRoomScores(room) {
    scores.delete(room);
  }
}

module.exports = StorageService; 