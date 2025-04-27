// File: my-backend/routes/timezoneRoutes.js
"use strict";

const express = require('express');
const router = express.Router();
const { listTimezones } = require('../controllers/timezoneController');

// GET /api/timezones
router.get('/', listTimezones);

module.exports = router;