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

router.post("/", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const url = `${req.protocol}://${req.get("host")}/api/uploads/${req.file.filename}`;
  res.json({ url });
});

module.exports = router;
