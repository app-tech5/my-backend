const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const getModelsWithImageField = require('./getModelsWithImageField');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

/**
 * Supprime les fichiers orphelins du dossier uploads.
 */
async function deleteOrphanedFiles() {
  try {
    console.log('Début du nettoyage des fichiers orphelins...');

    // Étape 1: Récupérer la liste des fichiers dans le dossier uploads
    console.log('Lecture du dossier uploads...');
    const files = fs.readdirSync(uploadsDir);
    console.log('Fichiers dans uploads :', files);

    // Étape 2: Récupérer tous les modèles avec un champ `image`
    console.log('Récupération des modèles avec un champ `image`...');
    const models = getModelsWithImageField();
    console.log('Modèles avec un champ `image` :', models.map(m => m.modelName));

    // Étape 3: Récupérer toutes les URLs d'images référencées dans la base de données
    console.log('Récupération des URLs d\'images référencées dans la base de données...');
    const usedImageUrls = new Set(); // Utilisation d'un Set pour éviter les doublons

    for (const model of models) {
      console.log(`Récupération des documents pour le modèle : ${model.modelName}`);
      const documents = await model.find({ image: { $exists: true } }); // Seuls les documents avec un champ `image`
      // console.log(`Documents trouvés pour ${model.modelName} :`, documents);

      documents.forEach(doc => {
        if (doc.image) {
          const filename = path.basename(doc.image); // Extraire le nom du fichier de l'URL
          console.log(`Fichier référencé trouvé : ${filename}`);
          usedImageUrls.add(filename); // Ajouter à l'ensemble des fichiers utilisés
        }
      });
    }

    console.log('Fichiers référencés dans la base de données :', Array.from(usedImageUrls));

    // Étape 4: Comparer les deux listes et supprimer les fichiers orphelins
    console.log('Début de la suppression des fichiers orphelins...');
    files.forEach(file => {
      if (!usedImageUrls.has(file)) {
        const filePath = path.join(uploadsDir, file);
        console.log(`Suppression du fichier orphelin : ${file}`);
        fs.unlinkSync(filePath); // Supprimer le fichier
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