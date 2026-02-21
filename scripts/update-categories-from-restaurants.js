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
const restaurantCategoriesData = [
  { count: 8, categoryId: null, categoryName: 'Italian' },
  { count: 7, categoryId: null, categoryName: 'American' },
  { count: 6, categoryId: null, categoryName: 'French' },
  { count: 5, categoryId: null, categoryName: 'Mediterranean' },
  { count: 5, categoryId: null, categoryName: 'Fast Food' },
  { count: 5, categoryId: null, categoryName: 'Seafood' },
  { count: 4, categoryId: null, categoryName: 'Asian' },
  { count: 1, categoryId: null, categoryName: 'Pizza' }
];
const categoryImages = {
  'Italian': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=400&fit=crop',
  'American': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
  'French': 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=400&fit=crop',
  'Mediterranean': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop',
  'Fast Food': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=400&fit=crop',
  'Seafood': 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&h=400&fit=crop',
  'Asian': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&h=400&fit=crop',
  'Pizza': 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=400&fit=crop'
};
async function updateCategories() {
  try {
    console.log('🚀 Démarrage de la mise à jour des catégories...');
    console.log('🗑️ Suppression de toutes les catégories existantes...');
    const deleteResult = await Category.deleteMany({});
    console.log(`✅ ${deleteResult.deletedCount} catégories supprimées`);
    console.log('\n🏗️ Création des nouvelles catégories...');
    for (const categoryData of restaurantCategoriesData) {
      const { categoryName, count } = categoryData;
      console.log(`📝 Création de la catégorie: ${categoryName} (${count} restaurants)`);
      const newCategory = new Category({
        name: categoryName,
        image: categoryImages[categoryName] || 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(categoryName)
      });
      await newCategory.save();
      console.log(`✅ Catégorie "${categoryName}" créée (ID: ${newCategory._id})`);
    }
    console.log('\n🎉 Mise à jour des catégories terminée avec succès !');
    const allCategories = await Category.find({}).sort({ name: 1 });
    console.log('\n📋 Résumé des catégories dans la base de données:');
    allCategories.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat._id})`);
    });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des catégories:', error);
  }
}
async function main() {
  await connectDB();
  await updateCategories();
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
module.exports = { updateCategories, restaurantCategoriesData };
