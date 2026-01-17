const mongoose = require('mongoose');
const Restaurant = require('../src/models/Restaurant');
const Category = require('../src/models/Category');

async function fixRestaurantCategories() {
  try {
    // Connexion à la DB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/good-foods');

    console.log('🔧 Début de la réparation des catégories des restaurants...');

    // 1. Récupérer toutes les catégories avec leurs noms
    const categories = await Category.find({}, 'name _id');
    console.log(`📂 ${categories.length} catégories trouvées:`);
    categories.forEach(cat => console.log(`  - ${cat.name}: ${cat._id}`));

    // 2. Créer un mapping nom -> ObjectId
    const categoryMap = new Map();
    categories.forEach(cat => {
      categoryMap.set(cat.name.toLowerCase().trim(), cat._id.toString());
    });

    // 3. Récupérer tous les restaurants (sans populate pour éviter l'erreur User)
    const restaurants = await mongoose.connection.db.collection('restaurants').find({}).toArray();
    console.log(`\n🏪 ${restaurants.length} restaurants à traiter`);

    let totalUpdated = 0;
    let totalCategoriesUpdated = 0;

    // 4. Pour chaque restaurant
    for (let i = 0; i < restaurants.length; i++) {
      const restaurant = restaurants[i];

      if (!restaurant.categories || restaurant.categories.length === 0) {
        console.log(`⏭️ Restaurant ${i + 1}/${restaurants.length}: ${restaurant.name} - pas de catégories`);
        continue;
      }

      console.log(`\n🔄 Restaurant ${i + 1}/${restaurants.length}: ${restaurant.name}`);

      let categoriesUpdated = false;
      const originalCategories = [...restaurant.categories];

      // 5. Mettre à jour chaque catégorie
      restaurant.categories = restaurant.categories.map((cat, index) => {
        console.log(`  📋 Catégorie ${index + 1}: "${cat.title}"`);

        // Chercher la correspondance par nom
        const categoryId = categoryMap.get(cat.title.toLowerCase().trim());

        if (categoryId) {
          console.log(`    ✅ Trouvé ID: ${categoryId}`);

          // Ajouter juste l'id
          cat.id = mongoose.Types.ObjectId(categoryId);

          categoriesUpdated = true;
          totalCategoriesUpdated++;
          return cat;
        } else {
          console.log(`    ❌ Pas de correspondance trouvée pour "${cat.title}"`);
          return cat;
        }
      });

      // 6. Sauvegarder si des changements ont été faits
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

    // 7. Test final - vérifier qu'un restaurant a bien les IDs
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

// Exécuter
fixRestaurantCategories();
