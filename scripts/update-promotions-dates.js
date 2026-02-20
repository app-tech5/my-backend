require('dotenv').config();
const mongoose = require('mongoose');
const Promotion = require('../src/models/Promotion');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/good-foods';
    console.log('🔗 Tentative de connexion à:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB');
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

const updatePromotions = async () => {
  try {
    console.log('🔄 MISE À JOUR DES PROMOTIONS - Début du processus...\n');
    
    const totalPromotions = await Promotion.countDocuments();
    console.log(`📊 Total des promotions dans la DB: ${totalPromotions}`);
    
    const scopeStats = await Promotion.aggregate([
      { $group: { _id: '$scope', count: { $sum: 1 } } }
    ]);

    console.log('📈 Répartition par scope:');
    scopeStats.forEach(stat => {
      console.log(`  - ${stat._id}: ${stat.count} promotions`);
    });
    
    const restaurantPromotions = await Promotion.find({ scope: 'restaurant' });
    console.log(`\n🎯 Promotions avec scope 'restaurant': ${restaurantPromotions.length}`);

    if (restaurantPromotions.length === 0) {
      console.log('⚠️ Aucune promotion avec scope restaurant trouvée.');
      return;
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); 
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30); 

    console.log(`\n📅 Nouvelles dates:`);
    console.log(`  - startDate: ${today.toISOString()}`);
    console.log(`  - endDate: ${thirtyDaysLater.toISOString()}`);
    
    let updatedCount = 0;
    let activatedCount = 0;

    for (const promotion of restaurantPromotions) {
      const wasActive = promotion.isActive;
      const oldStartDate = promotion.startDate;
      const oldEndDate = promotion.endDate;
      
      promotion.startDate = today;
      promotion.endDate = thirtyDaysLater;
      
      if (!promotion.isActive) {
        promotion.isActive = true;
        activatedCount++;
      }

      await promotion.save();
      updatedCount++;

      console.log(`✅ ${promotion.name}:`);
      console.log(`   Dates: ${oldStartDate?.toISOString()} → ${promotion.startDate.toISOString()}`);
      console.log(`   → ${oldEndDate?.toISOString()} → ${promotion.endDate.toISOString()}`);
      console.log(`   Active: ${wasActive} → ${promotion.isActive}`);
      console.log(`   Restaurants: ${promotion.applicableRestaurants?.join(', ')}\n`);
    }
    
    const finalRestaurantPromotions = await Promotion.find({
      scope: 'restaurant',
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    console.log('🎉 RÉSUMÉ DE LA MISE À JOUR:');
    console.log(`  ✅ Promotions mises à jour: ${updatedCount}`);
    console.log(`  🔄 Promotions activées: ${activatedCount}`);
    console.log(`  🎯 Promotions restaurant actives maintenant: ${finalRestaurantPromotions.length}`);
    
    if (finalRestaurantPromotions.length > 0) {
      console.log('\n🏷️ PROMOTIONS ACTIVES:');
      finalRestaurantPromotions.forEach(promo => {
        console.log(`  - "${promo.name}" (${promo.applicableRestaurants?.length || 0} restaurants)`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  }
};

const main = async () => {
  await connectDB();
  await updatePromotions();

  console.log('\n🏁 Script terminé avec succès!');
  process.exit(0);
};

process.on('unhandledRejection', (error) => {
  console.error('❌ Erreur non gérée:', error);
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = { updatePromotions };

