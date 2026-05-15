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

// --- NOUVELLE ROUTE RELAIS IMGBB (AJOUTÉE) ---
const uploadMemory = multer({ storage: multer.memoryStorage() });

router.post("/get-imgbb-link", uploadMemory.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const postData = new URLSearchParams({
      image: req.file.buffer.toString('base64'),
    });

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, {
      method: 'POST',
      body: postData,
    });

    const data = await response.json();

    if (data.success) {
      res.json({ url: data.data.url });
    } else {
      res.status(500).json({ error: "ImgBB upload failed" });
    }
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
});
// --------------------------------------------

module.exports = router;