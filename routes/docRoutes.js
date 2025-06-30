"use strict";
const express = require('express');
const router = express.Router();
const { createDoc, getDoc, updateDoc, setPermissions } = require('../controllers/docController');

router.post('/', createDoc);
router.get('/:id', getDoc);
router.post('/:id', updateDoc);
router.post('/:id/permissions', setPermissions);

module.exports = router;
