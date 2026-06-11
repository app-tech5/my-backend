const express = require("express");
const dotenv = require("dotenv");
const crypto = require("crypto");
const uploadRateLimit = require('../middleware/uploadRateLimit');
const uploadDiskQuota = require('../middleware/uploadDiskQuota');
const {
  privateUpload,
  publicUpload,
  memoryUpload,
  runUpload,
} = require('../utils/uploadValidation');
const { buildPublicFileUrl } = require('../utils/publicUpload');

dotenv.config();

const router = express.Router();

const blockDemoUpload = (req, res, next) => {
  if (process.env.DEMO_MODE === 'true') {
    return res.status(403).json({ message: res.__('demo_mode_action_not_available') });
  }
  next();
};

router.post(
  "/",
  blockDemoUpload,
  uploadRateLimit,
  uploadDiskQuota,
  runUpload(privateUpload.single("image")),
  (req, res) => {
    const url = `${req.protocol}://${req.get("host")}/api/uploads/${req.file.filename}`;
    res.json({ url });
  }
);

router.post(
  '/public',
  blockDemoUpload,
  uploadRateLimit,
  uploadDiskQuota,
  runUpload(publicUpload.single('image')),
  (req, res) => {
    const url = buildPublicFileUrl(req, req.body.folder, req.file.filename);
    res.json({ url });
  }
);

router.post(
  "/get-imgbb-link",
  blockDemoUpload,
  uploadRateLimit,
  uploadDiskQuota,
  runUpload(memoryUpload.single("image")),
  async (req, res) => {
    try {
      const postData = new URLSearchParams({
        image: req.file.buffer.toString("base64"),
      });

      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
        {
          method: "POST",
          body: postData,
        }
      );

      const data = await response.json();

      if (data.success) {
        res.json({ url: data.data.url });
      } else {
        res.status(500).json({ error: "ImgBB upload failed" });
      }
    } catch (error) {
      res.status(500).json({
        error: "Server Error",
        message: error.message,
      });
    }
  }
);

router.get("/cloudinary-signature", blockDemoUpload, (req, res) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = `timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`;
    const signature = crypto
      .createHash("sha1")
      .update(paramsToSign)
      .digest("hex");

    res.json({
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (error) {
    res.status(500).json({
      error: "Signature generation failed",
      message: error.message,
    });
  }
});

module.exports = router;
