// File: my-backend/routes/timeRoutes.js
"use strict";

const express = require('express');
const router = express.Router();
const { nowHandler, stateHandler, scheduleHandler, pauseHandler, resumeHandler, editHandler } = require('../controllers/timeController');
const { requireRoles } = require('../middleware/roleMiddleware');

// GET current time
router.get('/now', nowHandler);
// GET state of event
router.get('/:event/state', stateHandler);
// Schedule new countdown (admin, host, sys)
router.post('/:event/schedule', requireRoles(['sys','admin','host']), scheduleHandler);
// Pause countdown (sys, admin, judge, host)
router.post('/:event/pause',   requireRoles(['sys','admin','judge','host']), pauseHandler);
// Resume countdown
router.post('/:event/resume',  requireRoles(['sys','admin','judge','host']), resumeHandler);
// Edit countdown
router.post('/:event/edit',    requireRoles(['sys','admin','host']), editHandler);

module.exports = router;
