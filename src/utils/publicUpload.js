const path = require('path');
const fs = require('fs');
const { PUBLIC_FOLDERS, DEFAULT_FOLDER } = require('../config/publicUploads');

const PUBLIC_ROOT = path.join(__dirname, '../../public');

const getPublicFolder = (folder) => {
  const name = String(folder || DEFAULT_FOLDER).trim().toLowerCase();
  if (!PUBLIC_FOLDERS.includes(name)) {
    return DEFAULT_FOLDER;
  }
  return name;
};

const getPublicFolderPath = (folder) => {
  const dir = path.join(PUBLIC_ROOT, getPublicFolder(folder));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const buildPublicFileUrl = (req, folder, filename) =>
`${req.protocol}://${req.get('host')}/api/public/${getPublicFolder(folder)}/${filename}`;

module.exports = {
  getPublicFolder,
  getPublicFolderPath,
  buildPublicFileUrl
};
