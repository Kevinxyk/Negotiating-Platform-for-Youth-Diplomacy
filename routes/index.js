const express       = require("express");
const router        = express.Router();
const { checkRole } = require("../middleware/auth");

// Controllers
const textChatCtrl  = require("../controllers/textChatController");
const scoreCtrl     = require("../controllers/scoreController");
const timeService   = require("../services/timeService");

// Chat 模块
router.get(  "/chat/:room/messages",                       textChatCtrl.getChatHistory);
router.post( "/chat/:room/send",                           textChatCtrl.sendMessage);
router.post( "/chat/:room/message/:messageId/revoke", 
             checkRole("admin"),                          textChatCtrl.revokeMessage);
router.get(  "/chat/:room/summary/user",                   textChatCtrl.getUserSummary);
router.get(  "/chat/:room/summary/time",                   textChatCtrl.getTimeSummary);
router.get(  "/chat/:room/search",                         textChatCtrl.searchChat);

// Scoring 模块
router.post( "/score/:room",                                 scoreCtrl.submitScore);
router.get(  "/score/:room",                                 scoreCtrl.getAggregatedScores);
router.get(  "/score/:room/history/:user",                   scoreCtrl.getUserScoreHistory);
router.get(  "/score/:room/ranking",                         scoreCtrl.getRanking);
router.get(  "/score/:room/ai",         checkRole("sys"),     scoreCtrl.computeAIScore);

// Time 模拟
router.post("/time/schedule", (req, res) => {
  const { name, timeInfo } = req.body;
  timeService.scheduleEvent(name, timeInfo, () => {});
  res.json({ status: "scheduled" });
});
router.post("/time/pause", (req, res) => {
  timeService.pauseEvent(req.body.name);
  res.json({ status: "paused" });
});
router.post("/time/resume",(req, res) => {
  timeService.resumeEvent(req.body.name);
  res.json({ status: "resumed" });
});
router.get( "/time/fixed", (req, res) => {
  res.json(timeService.getFixedTimeData());
});

module.exports = router; 