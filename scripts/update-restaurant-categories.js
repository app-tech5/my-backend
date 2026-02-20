require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('../src/models/Restaurant');
const loadModels = require('../src/utils/loadModels');

const connectDB = async () => {
  try {
    const mongoUri = 'mongodb://localhost:27017/good-foods';
    console.log('🔗 Tentative de connexion à:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB');
    
    loadModels();
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Collections disponibles:', collections.map(c => c.name));
    
    const count = await mongoose.connection.db.collection('restaurants').countDocuments();
    console.log('📊 Nombre de documents dans restaurants:', count);

  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

const categoryMapping = {
  
  'cetera-calculus-tergo': 'Italian',
  'adsum-victus-expedita': 'Pizza',
  'dedecor-abundans-circumvenio': 'American',
  
  'accusantium-tero-comedo': 'Italian',
  'aegre-sequi-textilis': 'French',
  'aiunt-totam-vetus': 'Mediterranean',
  'alias-vis-ago': 'Seafood',
  'amaritudo-derelinquo-curiositas': 'American',
  'amor-avaritia-conspergo': 'Fast Food',
  'astrum-aperio-vester': 'Italian',
  'basium-aedificium-super': 'French',
  'bos-torqueo-conculco': 'American',
  'canis-video-culpa': 'Fast Food',
  'chirographum-ver-bellum': 'Asian',
  'consequatur-cunae-bos': 'Italian',
  'considero-tempore-creo': 'American',
  'cumque-quis-vis': 'Mediterranean',
  'curto-solvo-stipes': 'French',
  'decet-carpo-ante': 'Seafood',
  'delibero-aurum-curtus': 'Italian',
  'demergo-umquam-assentator': 'Fast Food',
  'deripio-claro-angulus': 'Asian',
  'esse-carmen-tandem': 'American',
  'fugiat-facilis-viduo': 'Mediterranean',
  'laboriosam-casus-vaco': 'French',
  'necessitatibus-surculus-triumphus': 'Seafood',
  'officia-coma-beneficium': 'Italian',
  'saepe-calculus-volup': 'Fast Food',
  'solum-inflammatio-avaritia': 'Asian',
  'spargo-aspernatur-quidem': 'American',
  'sublime-tabula-tracto': 'Mediterranean',
  'talio-conicio-sodalitas': 'French',
  'vallum-carmen-desparatus': 'Seafood',
  'vehemens-adfero-ratione': 'Italian',
  'vir-timor-confido': 'Fast Food',
  'viscus-viriliter-vicinus': 'Asian',
  'vita-cultura-traho': 'American',
  'vix-defessus-audacia': 'Mediterranean',
  'voluptas-cuppedia-certus': 'French',
  'voluptatibus-thymum-volo': 'Seafood',
  'voveo-audacia-dolorem': 'Italian',
  
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
    
    const restaurants = await mongoose.connection.db.collection('restaurants').find({}).toArray();
    console.log(`📊 Trouvé ${restaurants.length} restaurants via MongoDB direct`);
    
    const mongooseRestaurants = await Restaurant.find({});
    console.log(`📊 Trouvé ${mongooseRestaurants.length} restaurants via Mongoose`);

    let updatedCount = 0;

    for (const restaurant of restaurants) {
      let restaurantUpdated = false;
      let updatedCategories = [...restaurant.categories];

      if (restaurant.categories && Array.isArray(restaurant.categories)) {
        updatedCategories = restaurant.categories.map(category => {
          let updatedCategory = { ...category };
          
          if (updatedCategory.alias) {
            const mappedTitle = categoryMapping[updatedCategory.alias];
            if (mappedTitle) {
              
              if (updatedCategory.title !== mappedTitle) {
                console.log(`🔄 Restaurant "${restaurant.name}": ${updatedCategory.alias} → ${mappedTitle} (was: ${updatedCategory.title || 'null'})`);
                updatedCategory.title = mappedTitle;
                restaurantUpdated = true;
              }
            } else {
              
              if (!updatedCategory.title) {
                const formattedTitle = updatedCategory.alias
                  .split('-')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
                console.log(`🔄 Restaurant "${restaurant.name}": ${updatedCategory.alias} → ${formattedTitle} (formatted)`);
                updatedCategory.title = formattedTitle;
                restaurantUpdated = true;
              }
            }
          }
          return updatedCategory;
        });
      }

      if (restaurantUpdated) {
        
        await mongoose.connection.db.collection('restaurants').updateOne(
          { _id: restaurant._id },
          { $set: { categories: updatedCategories } }
        );
        updatedCount++;
      }
    }

    console.log(`✅ Mise à jour terminée: ${updatedCount} restaurants modifiés`);
    
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

const runScript = async () => {
  await connectDB();
  await updateRestaurantCategories();
  process.exit(0);
};

runScript();
