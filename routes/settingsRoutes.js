"use strict";
const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');

router.get('/', getSettings);
router.post('/', updateSettings);
router.get('/:userId', getSettings);
router.post('/:userId', updateSettings);

module.exports = router;
