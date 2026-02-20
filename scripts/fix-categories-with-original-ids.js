const mongoose = require('mongoose');
require('dotenv').config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/good-foods');
    console.log('✅ Connecté à MongoDB');
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error);
    process.exit(1);
  }
}

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Category = mongoose.model('Category', categorySchema);

const originalCategories = [
  { _id: '695d17d9ed0284bc20edc5e4', oldName: 'Pizza', newName: 'Pizza' },
  { _id: '695d17d9ed0284bc20edc5e5', oldName: 'Burger', newName: 'American' },
  { _id: '695d17d9ed0284bc20edc5e6', oldName: 'Sushi', newName: 'Asian' },
  { _id: '695d17d9ed0284bc20edc5e7', oldName: 'Pasta', newName: 'Italian' },
  { _id: '695d17d9ed0284bc20edc5e8', oldName: 'Salade', newName: 'Mediterranean' },
  { _id: '695d17d9ed0284bc20edc5e9', oldName: 'Dessert', newName: 'French' },
  { _id: '695d17d9ed0284bc20edc5ea', oldName: 'Boissons', newName: 'Fast Food' },
  { _id: '695d17d9ed0284bc20edc5eb', oldName: 'Asiatique', newName: 'Seafood' },
  { _id: '695d17d9ed0284bc20edc5ec', oldName: 'Mexicain', newName: 'Mediterranean' },
  { _id: '695d17d9ed0284bc20edc5ed', oldName: 'Végétarien', newName: 'French' }
];

const categoryImages = {
  'Pizza': 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=400&fit=crop',
  'American': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
  'Asian': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&h=400&fit=crop',
  'Italian': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=400&fit=crop',
  'Mediterranean': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop',
  'French': 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=400&fit=crop',
  'Fast Food': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=400&fit=crop',
  'Seafood': 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&h=400&fit=crop'
};

async function fixCategories() {
  try {
    console.log('🔧 Démarrage de la correction des catégories avec IDs originaux...');
    
    await Category.deleteMany({});
    console.log('🗑️ Toutes les catégories actuelles supprimées');
    
    console.log('🏗️ Recréation des catégories avec IDs originaux...');

    for (const catData of originalCategories) {
      const category = new Category({
        _id: catData._id,  
        name: catData.newName,
        image: categoryImages[catData.newName] || 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(catData.newName)
      });

      await category.save();
      console.log(`✅ "${catData.oldName}" → "${catData.newName}" (ID original conservé: ${catData._id})`);
    }

    console.log('\n🎉 Correction des catégories terminée !');
    
    const finalCategories = await Category.find({}).sort({ _id: 1 });
    console.log('\n📋 Vérification - Toutes les catégories recréées:');
    finalCategories.forEach(cat => {
      const original = originalCategories.find(orig => orig._id === cat._id.toString());
      console.log(`  - ${cat.name} (ID: ${cat._id}) ${original ? `✓ Ancien: ${original.oldName}` : '✗ ID inconnu'}`);
    });
    
    if (finalCategories.length !== originalCategories.length) {
      console.warn(`⚠️ Attention: ${finalCategories.length} catégories créées au lieu de ${originalCategories.length} attendues`);
    } else {
      console.log(`✅ Parfait: ${finalCategories.length} catégories recréées avec succès`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la correction des catégories:', error);
  }
}

async function main() {
  await connectDB();
  await fixCategories();
  
  await mongoose.connection.close();
  console.log('🔌 Connexion MongoDB fermée');
  process.exit(0);
}

process.on('unhandledRejection', (error) => {
  console.error('❌ Erreur non gérée:', error);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Interruption détectée, fermeture de la connexion...');
  await mongoose.connection.close();
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = { fixCategories, originalCategories };
