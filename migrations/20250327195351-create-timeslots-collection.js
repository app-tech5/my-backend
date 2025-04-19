// migrations/XXXXXX-generate-mock-timeslots.js

const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

module.exports = {
  async up(db) {
    try {
      await db.collection("timeslots").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    // Récupérer les restaurants existants
    const existingRestaurants = await db.collection('restaurants')
      .find({})
      .project({ _id: 1, name: 1 })
      .toArray();

    if (existingRestaurants.length === 0) {
      throw new Error('Aucun restaurant trouvé dans la base de données');
    }

    // Jours de la semaine disponibles
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const slotTypes = ['delivery', 'pickup', 'both'];

    // Générer des créneaux horaires fictifs (3 par restaurant)
    const mockTimeSlots = existingRestaurants.flatMap(restaurant => {
      return Array.from({ length: 3 }, () => {
        const day = faker.helpers.arrayElement(daysOfWeek);
        const startHour = faker.number.int({ min: 8, max: 12 }); // Entre 8h et 12h
        const endHour = startHour + faker.number.int({ min: 4, max: 8 }); // Durée de 4 à 8h
        
        return {
          restaurant: restaurant._id,
          restaurants: {
            value: restaurant._id.toString(),
            label: restaurant.name
          },
          day_of_week: day,
          start_time: `${startHour.toString().padStart(2, '0')}:00`,
          end_time: `${endHour.toString().padStart(2, '0')}:00`,
          max_orders: faker.number.int({ min: 10, max: 30 }),
          is_active: faker.datatype.boolean({ probability: 0.9 }), // 90% de chance d'être actif
          slot_type: faker.helpers.arrayElement(slotTypes),
          created_at: faker.date.past({ years: 1 }),
          updated_at: faker.date.recent({ days: 30 }),
        };
      });
    });

    // Insérer les créneaux horaires dans la base de données
    await db.collection('timeslots').insertMany(mockTimeSlots);
  },

  async down(db) {
    // Supprimer uniquement les créneaux générés (identifier par created_at récent)
    await db.collection('timeslots').deleteMany({
      created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};

// const mongoose = require("mongoose");

// module.exports = {
//   async up(db, client) {
//     // Création de la collection avec des données de test
//     await db.collection('timeslots').insertMany([
//       {
//         _id: new mongoose.Types.ObjectId("65de1a2b3c4d5e6f7a8b9101"),
//         restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997ca"), // ID d'un restaurant existant
//         day_of_week: "monday",
//         start_time: "11:00",
//         end_time: "14:00",
//         max_orders: 15,
//         is_active: true,
//         slot_type: "delivery",
//         createdAt: new Date(),
//         updatedAt: new Date()
//       },
//       {
//         _id: new mongoose.Types.ObjectId("65de1a2b3c4d5e6f7a8b9102"),
//         restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997ca"),
//         day_of_week: "monday",
//         start_time: "19:00",
//         end_time: "22:00",
//         max_orders: 20,
//         is_active: true,
//         slot_type: "delivery",
//         createdAt: new Date(),
//         updatedAt: new Date()
//       },
//       {
//         _id: new mongoose.Types.ObjectId("65de1a2b3c4d5e6f7a8b9103"),
//         restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997cb"), // ID d'un autre restaurant
//         day_of_week: "friday",
//         start_time: "18:00",
//         end_time: "23:00",
//         max_orders: 30,
//         is_active: true,
//         slot_type: "both",
//         createdAt: new Date(),
//         updatedAt: new Date()
//       }
//     ]);

//     // Création des index
//     await db.collection('timeslots').createIndex({ restaurant: 1 });
//     await db.collection('timeslots').createIndex({ day_of_week: 1, is_active: 1 });
//   },

//   async down(db, client) {
//     // Rollback : suppression des données et de la collection
//     await db.collection('timeslots').deleteMany({
//       _id: {
//         $in: [
//           new mongoose.Types.ObjectId("65de1a2b3c4d5e6f7a8b9101"),
//           new mongoose.Types.ObjectId("65de1a2b3c4d5e6f7a8b9102"),
//           new mongoose.Types.ObjectId("65de1a2b3c4d5e6f7a8b9103")
//         ]
//       }
//     });
//     await db.collection('timeslots').drop();
//   }
// };