// 处理音频数据
function handleAudioMessage(ws, message, roomId) {
  // 广播音频数据给房间内的其他用户
  const room = rooms.get(roomId);
  if (room) {
    room.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'audio',
          data: message.data
        }));
      }
    });
  }
}

// 在消息处理中添加音频类型
ws.on('message', message => {
  try {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'join':
        handleJoin(ws, data);
        break;
      case 'chat':
        handleChat(ws, data);
        break;
      case 'timer':
        handleTimer(ws, data);
        break;
      case 'raiseHand':
        handleRaiseHand(ws, data);
        break;
      case 'audio':
        handleAudioMessage(ws, data, ws.roomId);
        break;
    }
  } catch (e) {
    console.error('Invalid message', e);
  }
}); 