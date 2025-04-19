// migrations/XXXXXX-generate-mock-sales-reports.js

const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

module.exports = {
  async up(db) {
    try {
      await db.collection("salesreports").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    // Récupérer les restaurants existants
    const existingRestaurants = await db.collection('restaurants')
      .find({})
      .project({ _id: 1 })
      .toArray();

    // Récupérer les utilisateurs admin existants
    const existingAdmins = await db.collection('users')
      .find({ role: 'admin' }) // Supposant qu'il y a un champ 'role'
      .project({ _id: 1 })
      .toArray();

    if (existingAdmins.length === 0) {
      throw new Error('Aucun utilisateur admin trouvé dans la base de données');
    }

    // Catégories de produits possibles
    const productCategories = ['Food', 'Drinks', 'Desserts', 'Starters', 'Menus'];

    // Générer des rapports de vente fictifs
    const mockReports = Array.from({ length: 20 }, (_, i) => {
      const startDate = faker.date.past({ years: 1 });
      const endDate = faker.date.between({
        from: startDate,
        to: new Date()
      });
      
      const totalSales = faker.number.float({ min: 1000, max: 50000, precision: 0.01 });
      const totalOrders = faker.number.int({ min: 10, max: 500 });
      const averageOrderValue = totalSales / totalOrders;

      // Générer des ventes par catégorie
      const salesByCategory = productCategories.map(category => ({
        category,
        amount: faker.number.float({ min: 100, max: 10000, precision: 0.01 })
      }));

      return {
        restaurant: existingRestaurants.length > 0 
          ? faker.helpers.arrayElement(existingRestaurants)._id 
          : null,
        startDate,
        endDate,
        totalSales,
        totalOrders,
        averageOrderValue,
        salesByCategory,
        deliveryFees: faker.number.float({ min: 50, max: 2000, precision: 0.01 }),
        taxesCollected: faker.number.float({ min: 100, max: 5000, precision: 0.01 }),
        generatedBy: faker.helpers.arrayElement(existingAdmins)._id,
        status: faker.helpers.arrayElement(['pending', 'completed', 'completed', 'completed']), // 75% de chance d'être completed
        createdAt: faker.date.between({
          from: endDate,
          to: new Date()
        }),
        updatedAt: new Date()
      };
    });

    // Insérer les rapports dans la base de données
    await db.collection('salesreports').insertMany(mockReports);
  },

  async down(db) {
    // Supprimer uniquement les rapports générés (identifier par created_at récent)
    await db.collection('salesreports').deleteMany({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};

// const mongoose = require('mongoose');

// module.exports = {
//   async up(db, client) {
//     // Insertion de rapports de ventes factices
//     await db.collection('salesreports').insertMany([
//       {
//         _id: new mongoose.Types.ObjectId('66cc29e162de2f9a5b4f4001'),
//         title: "Rapport ventes - Janvier 2024",
//         reportType: "sales",
//         dateRange: {
//           start: new Date('2024-01-01T00:00:00Z'),
//           end: new Date('2024-01-31T23:59:59Z')
//         },
//         metrics: {
//           totalSales: 58420.50,
//           totalOrders: 1248,
//           averageOrderValue: 46.81,
//           topProducts: [
//             { product: "Burger Deluxe", quantity: 342 },
//             { product: "Pizza Margherita", quantity: 298 }
//           ]
//         },
//         restaurant: new mongoose.Types.ObjectId('65cc29e162de2f9a5b4f1234'), // ID fictif
//         generatedAt: new Date(),
//         status: "completed"
//       },
//       {
//         _id: new mongoose.Types.ObjectId('66cc29e162de2f9a5b4f4002'),
//         title: "Rapport ventes - Février 2024",
//         reportType: "sales",
//         dateRange: {
//           start: new Date('2024-02-01T00:00:00Z'),
//           end: new Date('2024-02-28T23:59:59Z')
//         },
//         metrics: {
//           totalSales: 62130.75,
//           totalOrders: 1352,
//           averageOrderValue: 45.95,
//           topProducts: [
//             { product: "Sushi Box", quantity: 415 },
//             { product: "Pad Thai", quantity: 387 }
//           ]
//         },
//         generatedAt: new Date(),
//         status: "completed"
//       }
//     ]);

//   },

//   async down(db, client) {
//     // Rollback : suppression des données et des indexes
//     await db.collection('salesreports').drop();
//   }
// };