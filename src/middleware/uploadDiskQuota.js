const fs = require('fs');
const path = require('path');
const i18n = require('../config/i18n');
const { MAX_DISK_BYTES } = require('../config/uploadSecurity');
const { PUBLIC_FOLDERS } = require('../config/publicUploads');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
const publicDir = path.join(__dirname, '..', '..', 'public');

function getDirSize(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;

  let total = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      total += getDirSize(fullPath);
    } else {
      total += fs.statSync(fullPath).size;
    }
  });

  return total;
}

function getUploadsDiskUsage() {
  let total = getDirSize(uploadsDir);

  PUBLIC_FOLDERS.forEach((folder) => {
    total += getDirSize(path.join(publicDir, folder));
  });

  return total;
}

const uploadDiskQuota = (req, res, next) => {
  if (getUploadsDiskUsage() >= MAX_DISK_BYTES) {
    return res.status(507).json({ message: i18n.__('upload_disk_quota_exceeded') });
  }
  next();
};

module.exports = uploadDiskQuota;
