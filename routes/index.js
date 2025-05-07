const express       = require("express");
const router        = express.Router();
const { checkRole, verifyToken } = require("../middleware/auth");
const voiceChatCtrl = require("../controllers/voiceChatController");
const upload        = require("../middleware/upload");
const { requireRoles } = require("../middleware/roleMiddleware");

// Controllers
const textChatCtrl  = require("../controllers/textChatController");
const scoreCtrl     = require("../controllers/scoreController");
const timeCtrl      = require("../controllers/timeController");
const audioCtrl     = require("../controllers/audioController");

// Chat 模块
router.get(  "/chat/:room/messages",                       verifyToken, textChatCtrl.getChatHistory);
router.post( "/chat/:room/send",                           verifyToken, textChatCtrl.sendMessage);
router.post( "/chat/:room/message/:messageId/revoke", 
             verifyToken,
             checkRole("admin"),                          textChatCtrl.revokeMessage);
router.get(  "/chat/:room/summary/user",                   verifyToken, textChatCtrl.getUserSummary);
router.get(  "/chat/:room/summary/time",                   verifyToken, textChatCtrl.getTimeSummary);
router.get(  "/chat/:room/search",                         verifyToken, textChatCtrl.searchChat);
router.get("/chat/:room/summary/user/details", verifyToken, textChatCtrl.getUserSummaryDetail);
router.get("/chat/:room/summary/time/details", verifyToken, textChatCtrl.getTimeSummaryDetail);

// Scoring 模块
router.post( "/score/:room",                                 verifyToken, checkRole(["admin", "host"]), scoreCtrl.submitScore);
router.get(  "/score/:room",                                 verifyToken, scoreCtrl.getAggregatedScores);
router.get(  "/score/:room/history/:user",                   verifyToken, scoreCtrl.getUserScoreHistory);
router.get(  "/score/:room/ranking",                         verifyToken, scoreCtrl.getRanking);
router.get(  "/score/:room/ai",         verifyToken, checkRole("admin"),     scoreCtrl.computeAIScore);

// Time 模块
router.post("/time/:event/schedule", 
  verifyToken, 
  checkRole(["admin", "host"]), 
  timeCtrl.scheduleEvent
);

router.post("/time/:event/pause", 
  verifyToken, 
  checkRole(["admin", "host"]), 
  timeCtrl.pauseEvent
);

router.post("/time/:event/resume", 
  verifyToken, 
  checkRole(["admin", "host"]), 
  timeCtrl.resumeEvent
);

router.get("/time/:event/state", 
  verifyToken, 
  timeCtrl.getEventState
);

router.get("/time/fixed", 
  verifyToken, 
  timeCtrl.getFixedTimeData
);

// Audio 模块
router.post("/audio/:room/upload", 
  verifyToken, 
  audioCtrl.uploadRecording
);

router.post("/audio/:room/control", 
  verifyToken, 
  audioCtrl.controlRecording
);

router.get("/audio/:room/recordings", 
  verifyToken, 
  audioCtrl.getRecordings
);

router.delete("/audio/:room/recording/:recordingId", 
  verifyToken, 
  audioCtrl.deleteRecording
);

// Voice Chat 模块
router.post("/voice/chat/:room", 
  verifyToken, 
  requireRoles(['delegate','sys','admin','host']), 
  upload.single('audio'), 
  voiceChatCtrl.handleVoiceChat
);

module.exports = router; 