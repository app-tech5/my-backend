const express = require("express");
const multer = require("multer");
const path = require("path");
const dotenv = require('dotenv');

dotenv.config();
const router = express.Router();

// 📌 Configuration de multer pour stocker les fichiers dans un dossier "uploads"
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// 📌 Route pour uploader une image
// router.post("/", upload.single("image"), (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: "Aucun fichier envoyé" });
//   }


//   const fileUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;

//   console.log(fileUrl);
//   res.json({ url: fileUrl });
// });

module.exports = router;
