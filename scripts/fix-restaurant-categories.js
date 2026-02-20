const mongoose = require('mongoose');
const Restaurant = require('../src/models/Restaurant');
const Category = require('../src/models/Category');

async function fixRestaurantCategories() {
  try {
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/good-foods');

    console.log('🔧 Début de la réparation des catégories des restaurants...');
    
    const categories = await Category.find({}, 'name _id');
    console.log(`📂 ${categories.length} catégories trouvées:`);
    categories.forEach(cat => console.log(`  - ${cat.name}: ${cat._id}`));
    
    const categoryMap = new Map();
    categories.forEach(cat => {
      categoryMap.set(cat.name.toLowerCase().trim(), cat._id.toString());
    });
    
    const restaurants = await mongoose.connection.db.collection('restaurants').find({}).toArray();
    console.log(`\n🏪 ${restaurants.length} restaurants à traiter`);

    let totalUpdated = 0;
    let totalCategoriesUpdated = 0;
    
    for (let i = 0; i < restaurants.length; i++) {
      const restaurant = restaurants[i];

      if (!restaurant.categories || restaurant.categories.length === 0) {
        console.log(`⏭️ Restaurant ${i + 1}/${restaurants.length}: ${restaurant.name} - pas de catégories`);
        continue;
      }

      console.log(`\n🔄 Restaurant ${i + 1}/${restaurants.length}: ${restaurant.name}`);

      let categoriesUpdated = false;
      const originalCategories = [...restaurant.categories];
      
      restaurant.categories = restaurant.categories.map((cat, index) => {
        console.log(`  📋 Catégorie ${index + 1}: "${cat.title}"`);
        
        const categoryId = categoryMap.get(cat.title.toLowerCase().trim());

        if (categoryId) {
          console.log(`    ✅ Trouvé ID: ${categoryId}`);
          
          cat.id = mongoose.Types.ObjectId(categoryId);

          categoriesUpdated = true;
          totalCategoriesUpdated++;
          return cat;
        } else {
          console.log(`    ❌ Pas de correspondance trouvée pour "${cat.title}"`);
          return cat;
        }
      });
      
      if (categoriesUpdated) {
        await mongoose.connection.db.collection('restaurants').updateOne(
          { _id: restaurant._id },
          { $set: { categories: restaurant.categories } }
        );
        console.log(`    💾 Restaurant sauvegardé`);
        totalUpdated++;
      } else {
        console.log(`    ⏭️ Aucune modification nécessaire`);
      }
    }

    console.log(`\n🎉 RÉSUMÉ:`);
    console.log(`   - ${totalUpdated} restaurants mis à jour`);
    console.log(`   - ${totalCategoriesUpdated} catégories liées`);
    
    console.log(`\n🧪 TEST FINAL:`);
    const testRestaurant = await Restaurant.findOne({}, 'name categories').populate('categories.id', 'name');
    if (testRestaurant) {
      console.log(`Restaurant test: ${testRestaurant.name}`);
      console.log(`Catégories (${testRestaurant.categories.length}):`);
      testRestaurant.categories.forEach((cat, i) => {
        console.log(`  ${i + 1}. ${cat.title} -> ID: ${cat.id} -> Populée: ${cat.id?.name || 'null'}`);
      });
    }

  } catch (error) {
    console.error('❌ ERREUR:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📪 Déconnexion DB');
  }
}

fixRestaurantCategories();
