const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const i18n = require('../config/i18n');
const getModelsWithImageField = require('./getModelsWithImageField');
const getModelsWithImageOrDocumentsField = require('./getModelsWithImageField');
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
async function deleteOrphanedFiles() {
  try {
    const files = fs.readdirSync(uploadsDir);
    const models = getModelsWithImageOrDocumentsField();
    const usedFiles = new Set(); 
    for (const model of models) {
      const documents = await model.find({
        $or: [
          { image: { $exists: true } },
          { documents: { $exists: true } },
          { logoUrl: { $exists: true } },
        ],
      });
      documents.forEach(doc => {
        if (doc.image) {
          const filename = path.basename(doc.image);
          usedFiles.add(filename);
        }
        if (doc.logoUrl) {
          const filename = path.basename(doc.logoUrl);
          usedFiles.add(filename);
        }
        if (Array.isArray(doc.documents)) {
          doc.documents.forEach(docItem => {
            if (docItem.fileUrl) {
              const filename = path.basename(docItem.fileUrl);
              usedFiles.add(filename);
            }
          });
        }
      });
    }
    files.forEach(file => {
      if (!usedFiles.has(file)) {
        const filePath = path.join(uploadsDir, file);
        fs.unlinkSync(filePath);
      }
    });
  } catch (error) {
  }
}
module.exports = deleteOrphanedFiles;