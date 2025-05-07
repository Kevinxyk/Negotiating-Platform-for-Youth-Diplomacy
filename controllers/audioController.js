"use strict";
const audioService = require("../services/audioService");

/**
 * POST /api/audio/:room/upload
 * 上传录音（所有登录用户可用）
 */
async function uploadRecording(req, res) {
  try {
    const room = req.params.room;
    const { audioData, title, description } = req.body;
    
    const recording = await audioService.saveRecording(room, {
      audioData,
      title,
      description,
      uploader: req.user.username,
      uploaderRole: req.user.role
    });

    res.status(201).json({
      message: "录音已上传",
      recording
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/audio/:room/control
 * 控制录音播放（所有登录用户可用）
 */
async function controlRecording(req, res) {
  try {
    const room = req.params.room;
    const { recordingId, action } = req.body;
    
    const result = await audioService.controlRecording(room, recordingId, {
      action,
      operator: req.user.username,
      operatorRole: req.user.role
    });

    res.json({
      message: "操作已执行",
      result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/audio/:room/recordings
 * 获取录音列表（所有登录用户可用）
 */
async function getRecordings(req, res) {
  try {
    const room = req.params.room;
    const recordings = await audioService.getRecordings(room);
    res.json(recordings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/audio/:room/recording/:recordingId
 * 删除录音（仅录音上传者或管理员可用）
 */
async function deleteRecording(req, res) {
  try {
    const room = req.params.room;
    const recordingId = req.params.recordingId;
    
    const recording = await audioService.getRecordingById(recordingId);
    
    // 检查权限：只有上传者或管理员可以删除
    if (recording.uploader !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ error: '没有权限删除此录音' });
    }

    await audioService.deleteRecording(room, recordingId);
    res.json({ message: "录音已删除" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  uploadRecording,
  controlRecording,
  getRecordings,
  deleteRecording
}; 