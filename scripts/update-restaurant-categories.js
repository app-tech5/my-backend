require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('../src/models/Restaurant');
const loadModels = require('../src/utils/loadModels');

// Connexion à la base de données
const connectDB = async () => {
  try {
    const mongoUri = 'mongodb://localhost:27017/good-foods';
    console.log('🔗 Tentative de connexion à:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB');

    // Charger tous les modèles
    loadModels();

    // Lister les collections disponibles
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Collections disponibles:', collections.map(c => c.name));

    // Compter les documents dans restaurants
    const count = await mongoose.connection.db.collection('restaurants').countDocuments();
    console.log('📊 Nombre de documents dans restaurants:', count);

  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

// Mapping des alias vers des vrais noms de catégories
const categoryMapping = {
  // Alias trouvés dans la DB vers vrais noms
  'cetera-calculus-tergo': 'Italian',
  'adsum-victus-expedita': 'Pizza',
  'dedecor-abundans-circumvenio': 'American',
  'fast-food': 'Fast Food',
  'seafood': 'Seafood',
  'thai': 'Thai',
  'korean': 'Korean',
  'dimsum': 'Dim Sum',
  'peruvian': 'Peruvian',
  'mexican': 'Mexican',
  'japanese': 'Japanese',
  'french': 'French',
  'chinese': 'Chinese',
  'indian': 'Indian',
  'mediterranean': 'Mediterranean',
  'greek': 'Greek',
  'spanish': 'Spanish',
  'german': 'German'
};

const updateRestaurantCategories = async () => {
  try {
    console.log('🍽️ Mise à jour des catégories des restaurants...');

    // Récupérer tous les restaurants via MongoDB direct
    const restaurants = await mongoose.connection.db.collection('restaurants').find({}).toArray();
    console.log(`📊 Trouvé ${restaurants.length} restaurants via MongoDB direct`);

    // Essayer aussi via Mongoose
    const mongooseRestaurants = await Restaurant.find({});
    console.log(`📊 Trouvé ${mongooseRestaurants.length} restaurants via Mongoose`);

    let updatedCount = 0;

    for (const restaurant of restaurants) {
      let restaurantUpdated = false;
      let updatedCategories = [...restaurant.categories];

      if (restaurant.categories && Array.isArray(restaurant.categories)) {
        updatedCategories = restaurant.categories.map(category => {
          let updatedCategory = { ...category };

          // Si title est null ou undefined, essayer de le mapper depuis l'alias
          if (!updatedCategory.title && updatedCategory.alias) {
            const mappedTitle = categoryMapping[updatedCategory.alias];
            if (mappedTitle) {
              console.log(`🔄 Restaurant "${restaurant.name}": ${updatedCategory.alias} → ${mappedTitle}`);
              updatedCategory.title = mappedTitle;
              restaurantUpdated = true;
            } else {
              // Si pas de mapping, utiliser l'alias formaté
              const formattedTitle = updatedCategory.alias
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              console.log(`🔄 Restaurant "${restaurant.name}": ${updatedCategory.alias} → ${formattedTitle} (formatted)`);
              updatedCategory.title = formattedTitle;
              restaurantUpdated = true;
            }
          }
          return updatedCategory;
        });
      }

      if (restaurantUpdated) {
        // Mettre à jour via MongoDB direct
        await mongoose.connection.db.collection('restaurants').updateOne(
          { _id: restaurant._id },
          { $set: { categories: updatedCategories } }
        );
        updatedCount++;
      }
    }

    console.log(`✅ Mise à jour terminée: ${updatedCount} restaurants modifiés`);

    // Vérifier le résultat avec un exemple
    const sampleRestaurant = await Restaurant.findOne().limit(1);
    if (sampleRestaurant && sampleRestaurant.categories) {
      console.log('📋 Exemple de restaurant mis à jour:');
      console.log(`Nom: ${sampleRestaurant.name}`);
      console.log('Catégories:', sampleRestaurant.categories.map(cat => ({
        alias: cat.alias,
        title: cat.title
      })));
    }

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Exécuter le script
const runScript = async () => {
  await connectDB();
  await updateRestaurantCategories();
  process.exit(0);
};

runScript();
