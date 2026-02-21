const mongoose = require('mongoose');
const Promotion = require('../src/models/Promotion');
const fs = require('fs');
const path = require('path');
async function backupPromotions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/good-foods');
    console.log('💾 Début du backup des promotions...');
    const promotions = await Promotion.find({}).lean(); 
    console.log(`📊 ${promotions.length} promotions trouvées`);
    const backupsDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
      console.log('📁 Dossier backups créé');
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `promotions-backup-${timestamp}.json`;
    const filepath = path.join(backupsDir, filename);
    const backupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        totalPromotions: promotions.length,
        database: 'good-foods',
        collection: 'promotions'
      },
      promotions: promotions
    };
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2), 'utf8');
    console.log('✅ BACKUP CRÉÉ AVEC SUCCÈS !');
    console.log(`   📄 Fichier: ${filename}`);
    console.log(`   📍 Chemin: ${filepath}`);
    console.log(`   📊 Promotions sauvegardées: ${promotions.length}`);
    const backupFiles = fs.readdirSync(backupsDir)
      .filter(file => file.startsWith('promotions-backup-'))
      .sort()
      .reverse();
    console.log('\n📋 FICHIERS DE BACKUP EXISTANTS:');
    backupFiles.slice(0, 5).forEach((file, index) => {
      const filePath = path.join(backupsDir, file);
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024).toFixed(1) + ' KB';
      console.log(`   ${index + 1}. ${file} (${size})`);
    });
    if (backupFiles.length > 5) {
      console.log(`   ... et ${backupFiles.length - 5} autres fichiers`);
    }
  } catch (error) {
    console.error('❌ Erreur lors du backup:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📪 Déconnexion DB');
  }
}
backupPromotions();
