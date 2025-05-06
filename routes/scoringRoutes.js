// File: my-backend/routes/scoringRoutes.js
"use strict";
const express = require('express');
const router = express.Router();
const { requireRoles } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/scoringController');

// Submit/update multi-dim score (judge/admin/sys)
router.post('/:roomId', requireRoles(['judge','admin','sys']), ctrl.submitScoreHandler);
// Get aggregated scores
router.get('/:roomId', ctrl.getScoresHandler);
// Get history for a user
router.get('/:roomId/history/:userId', ctrl.getScoreHistoryHandler);
// Get ranking
router.get('/:roomId/ranking', ctrl.getRankingHandler);
// Get AI score
router.post('/:roomId/ai', requireRoles(['sys','admin']), ctrl.computeAIHandler);

module.exports = router;
