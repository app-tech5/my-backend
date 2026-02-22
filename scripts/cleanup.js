const mongoose = require('mongoose');
const i18n = require('../src/config/i18n');
const deleteOrphanedFiles = require('../src/utils/cleanupOrphanedFiles');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    await deleteOrphanedFiles();
    process.exit(0);
  })
  .catch(err => {
    console.error(i18n.__('database_connection_error'), err);
    process.exit(1);
  });