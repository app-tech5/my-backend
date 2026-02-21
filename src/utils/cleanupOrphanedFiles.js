const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const getModelsWithImageField = require('./getModelsWithImageField');
const getModelsWithImageOrDocumentsField = require('./getModelsWithImageField');
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
async function deleteOrphanedFiles() {
  try {
    console.log('Début du nettoyage des fichiers orphelins...');
    console.log('Lecture du dossier uploads...');
    const files = fs.readdirSync(uploadsDir);
    console.log('Fichiers dans uploads :', files);
    console.log('Récupération des modèles avec un champ `image` ou `documents`...');
    const models = getModelsWithImageOrDocumentsField();
    console.log('Modèles concernés :', models.map(m => m.modelName));
    console.log('Récupération des fichiers référencés dans la base de données...');
    const usedFiles = new Set(); 
    for (const model of models) {
      console.log(`Récupération des documents pour le modèle : ${model.modelName}`);
      const documents = await model.find({
        $or: [{ image: { $exists: true } }, { documents: { $exists: true } }]
      });
      documents.forEach(doc => {
        if (doc.image) {
          const filename = path.basename(doc.image);
          console.log(`Fichier référencé (image) trouvé : ${filename}`);
          usedFiles.add(filename);
        }
        if (Array.isArray(doc.documents)) {
          doc.documents.forEach(docItem => {
            if (docItem.fileUrl) {
              const filename = path.basename(docItem.fileUrl);
              console.log(`Fichier référencé (document) trouvé : ${filename}`);
              usedFiles.add(filename);
            }
          });
        }
      });
    }
    console.log('Fichiers référencés dans la base de données :', Array.from(usedFiles));
    console.log('Début de la suppression des fichiers orphelins...');
    files.forEach(file => {
      if (!usedFiles.has(file)) {
        const filePath = path.join(uploadsDir, file);
        console.log(`Suppression du fichier orphelin : ${file}`);
        fs.unlinkSync(filePath);
      } else {
        console.log(`Fichier utilisé, non supprimé : ${file}`);
      }
    });
    console.log('Nettoyage des fichiers orphelins terminé.');
  } catch (error) {
    console.error('Erreur lors du nettoyage des fichiers orphelins :', error);
  }
}
module.exports = deleteOrphanedFiles;