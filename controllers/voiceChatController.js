"use strict";
const voiceChatService = require("../services/voiceChatService");

/**
 * Handle voice chat: receive uploaded audio, process via STT, AI chat, TTS
 */
async function handleVoiceChat(req, res) {
  try {
    const { room } = req.params;
    const { username } = req.user;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    // Process the voice chat
    const result = await voiceChatService.processVoiceChat(room, file, username);
    res.json(result);
  } catch (error) {
    console.error("Voice chat error:", error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { handleVoiceChat }; 