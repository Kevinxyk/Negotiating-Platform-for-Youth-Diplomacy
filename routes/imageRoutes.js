// File: routes/imageRoutes.js
"use strict";
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadImage, getImage, downloadImage } = require('../controllers/imageController');
const { verifyToken } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../uploads/images');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9\.\-]/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片'), false);
  }
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/upload', verifyToken, upload.single('image'), uploadImage);
router.get('/:imageId', getImage);
router.get('/download/:imageId', downloadImage);

module.exports = router;
