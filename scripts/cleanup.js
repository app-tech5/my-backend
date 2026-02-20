const mongoose = require('mongoose');
const deleteOrphanedFiles = require('../src/utils/cleanupOrphanedFiles');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connecté à la base de données');
    await deleteOrphanedFiles(); 
    process.exit(0); 
  })
  .catch(err => {
    console.error('Erreur de connexion à la base de données :', err);
    process.exit(1); 
  });