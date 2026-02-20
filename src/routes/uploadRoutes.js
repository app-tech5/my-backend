const express = require("express");
const multer = require("multer");
const path = require("path");
const dotenv = require('dotenv');

dotenv.config();
const router = express.Router();

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

module.exports = router;
