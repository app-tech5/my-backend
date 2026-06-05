const fs = require('fs');
const path = require('path');
const getModelsWithImageOrDocumentsField = require('./getModelsWithImageField');
const { PUBLIC_FOLDERS } = require('../config/publicUploads');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
const publicDir = path.join(__dirname, '..', '..', 'public');

function addUsedFileFromUrl(url, usedUploads, usedPublic) {
  if (!url || typeof url !== 'string') return;

  if (url.includes('/api/uploads/')) {
    usedUploads.add(path.basename(url));
  }

  if (url.includes('/api/public/')) {
    const relative = url.split('/api/public/')[1]?.split('?')[0];
    if (relative) usedPublic.add(relative);
  }
}

function collectUsedFilesFromDoc(doc, usedUploads, usedPublic) {
  addUsedFileFromUrl(doc.image, usedUploads, usedPublic);
  addUsedFileFromUrl(doc.logoUrl, usedUploads, usedPublic);
  addUsedFileFromUrl(doc.imageUrl, usedUploads, usedPublic);
  addUsedFileFromUrl(doc.image_url, usedUploads, usedPublic);

  if (Array.isArray(doc.documents)) {
    doc.documents.forEach((docItem) => {
      addUsedFileFromUrl(docItem.fileUrl, usedUploads, usedPublic);
    });
  }
}

function cleanUploadsDir(usedUploads) {
  if (!fs.existsSync(uploadsDir)) return;

  const files = fs.readdirSync(uploadsDir);
  files.forEach((file) => {
    if (file === '.gitkeep') return;
    if (!usedUploads.has(file)) {
      fs.unlinkSync(path.join(uploadsDir, file));
    }
  });
}

function cleanPublicDir(usedPublic) {
  PUBLIC_FOLDERS.forEach((folder) => {
    const folderPath = path.join(publicDir, folder);
    if (!fs.existsSync(folderPath)) return;

    const files = fs.readdirSync(folderPath);
    files.forEach((file) => {
      if (file === '.gitkeep') return;

      const relativePath = `${folder}/${file}`;
      if (!usedPublic.has(relativePath)) {
        fs.unlinkSync(path.join(folderPath, file));
      }
    });
  });
}

async function deleteOrphanedFiles() {
  try {
    const models = getModelsWithImageOrDocumentsField();
    const usedUploads = new Set();
    const usedPublic = new Set();

    for (const model of models) {
      const documents = await model.find({
        $or: [
          { image: { $exists: true } },
          { documents: { $exists: true } },
          { logoUrl: { $exists: true } },
          { imageUrl: { $exists: true } },
          { image_url: { $exists: true } },
        ],
      });

      documents.forEach((doc) => collectUsedFilesFromDoc(doc, usedUploads, usedPublic));
    }

    cleanUploadsDir(usedUploads);
    cleanPublicDir(usedPublic);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

module.exports = deleteOrphanedFiles;