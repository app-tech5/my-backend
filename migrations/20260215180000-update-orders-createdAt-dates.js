// Migration: Update orders createdAt dates with distributed dates
// Updates existing orders createdAt field with dates spread across today, this week, and this month

const mongoose = require('mongoose');

module.exports = {
  async up(db) {
    try {
      console.log('🔄 Mise à jour des dates createdAt des commandes existantes...');

      // Vérifier s'il y a des commandes existantes
      const existingCount = await db.collection('orders').countDocuments();
      console.log(`📊 Nombre de commandes existantes: ${existingCount}`);

      if (existingCount === 0) {
        console.log('⚠️  Aucune commande existante à mettre à jour.');
        return;
      }

      // Récupérer tous les orders existants
      const orders = await db.collection('orders').find({}).toArray();
      console.log(`🔍 ${orders.length} commandes trouvées`);

      // Générer des dates réparties
      const now = new Date();

      // Aujourd'hui
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      // Cette semaine (7 derniers jours)
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);

      // Ce mois (30 derniers jours)
      const monthStart = new Date(now);
      monthStart.setDate(monthStart.getDate() - 30);
      monthStart.setHours(0, 0, 0, 0);

      // Répartition des commandes
      const totalOrders = orders.length;
      const todayCount = Math.ceil(totalOrders * 0.2); // 20% aujourd'hui
      const weekCount = Math.ceil(totalOrders * 0.3);  // 30% cette semaine
      const monthCount = totalOrders - todayCount - weekCount; // Le reste ce mois

      console.log(`📅 Répartition des dates:`);
      console.log(`   - ${todayCount} commandes aujourd'hui`);
      console.log(`   - ${weekCount} commandes cette semaine (7 derniers jours)`);
      console.log(`   - ${monthCount} commandes ce mois (30 derniers jours)`);

      // Mettre à jour les commandes par lots
      let updatedCount = 0;

      // Aujourd'hui
      for (let i = 0; i < todayCount && i < orders.length; i++) {
        const randomHour = Math.floor(Math.random() * 24);
        const randomMinute = Math.floor(Math.random() * 60);
        const randomSecond = Math.floor(Math.random() * 60);

        const newCreatedAt = new Date(todayStart);
        newCreatedAt.setHours(randomHour, randomMinute, randomSecond, 0);

        await db.collection('orders').updateOne(
          { _id: orders[i]._id },
          {
            $set: {
              createdAt: newCreatedAt,
              updatedAt: new Date(newCreatedAt.getTime() + Math.random() * 24 * 60 * 60 * 1000) // +0-24h
            }
          }
        );
        updatedCount++;
      }

      // Cette semaine
      for (let i = todayCount; i < todayCount + weekCount && i < orders.length; i++) {
        const randomTime = weekStart.getTime() + Math.random() * (now.getTime() - weekStart.getTime());
        const newCreatedAt = new Date(randomTime);

        await db.collection('orders').updateOne(
          { _id: orders[i]._id },
          {
            $set: {
              createdAt: newCreatedAt,
              updatedAt: new Date(newCreatedAt.getTime() + Math.random() * 24 * 60 * 60 * 1000) // +0-24h
            }
          }
        );
        updatedCount++;
      }

      // Ce mois
      for (let i = todayCount + weekCount; i < orders.length; i++) {
        const randomTime = monthStart.getTime() + Math.random() * (weekStart.getTime() - monthStart.getTime());
        const newCreatedAt = new Date(randomTime);

        await db.collection('orders').updateOne(
          { _id: orders[i]._id },
          {
            $set: {
              createdAt: newCreatedAt,
              updatedAt: new Date(newCreatedAt.getTime() + Math.random() * 24 * 60 * 60 * 1000) // +0-24h
            }
          }
        );
        updatedCount++;
      }

      console.log(`✅ ${updatedCount} commandes mises à jour avec succès`);

      // Vérification finale
      const todayCheck = await db.collection('orders').countDocuments({ createdAt: { $gte: todayStart } });
      const weekCheck = await db.collection('orders').countDocuments({ createdAt: { $gte: weekStart, $lt: todayStart } });
      const monthCheck = await db.collection('orders').countDocuments({ createdAt: { $gte: monthStart, $lt: weekStart } });

      console.log(`🔍 Vérification:`);
      console.log(`   - Commandes aujourd'hui: ${todayCheck}`);
      console.log(`   - Commandes cette semaine: ${weekCheck}`);
      console.log(`   - Commandes ce mois: ${monthCheck}`);

    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error.message);
      throw error;
    }
  },

  async down(db) {
    try {
      console.log('🔄 Annulation: restauration des dates createdAt originales...');

      // Remettre les dates createdAt à la date actuelle (approximation)
      const now = new Date();
      const result = await db.collection('orders').updateMany(
        {},
        {
          $set: {
            createdAt: now,
            updatedAt: now
          }
        }
      );

      console.log(`🔄 ${result.modifiedCount} commandes remises à jour avec la date actuelle`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation:', error.message);
      throw error;
    }
  }
};
