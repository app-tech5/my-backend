const mongoose = require("mongoose");

module.exports = {
  async up(db, client) {
    // Création de la collection avec des données de test
    await db.collection('timeslots').insertMany([
      {
        _id: new mongoose.Types.ObjectId("65de1a2b3c4d5e6f7a8b9101"),
        restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997ca"), // ID d'un restaurant existant
        day_of_week: "monday",
        start_time: "11:00",
        end_time: "14:00",
        max_orders: 15,
        is_active: true,
        slot_type: "delivery",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId("65de1a2b3c4d5e6f7a8b9102"),
        restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997ca"),
        day_of_week: "monday",
        start_time: "19:00",
        end_time: "22:00",
        max_orders: 20,
        is_active: true,
        slot_type: "delivery",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId("65de1a2b3c4d5e6f7a8b9103"),
        restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997cb"), // ID d'un autre restaurant
        day_of_week: "friday",
        start_time: "18:00",
        end_time: "23:00",
        max_orders: 30,
        is_active: true,
        slot_type: "both",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Création des index
    await db.collection('timeslots').createIndex({ restaurant: 1 });
    await db.collection('timeslots').createIndex({ day_of_week: 1, is_active: 1 });
  },

  async down(db, client) {
    // Rollback : suppression des données et de la collection
    await db.collection('timeslots').deleteMany({
      _id: {
        $in: [
          new mongoose.Types.ObjectId("65de1a2b3c4d5e6f7a8b9101"),
          new mongoose.Types.ObjectId("65de1a2b3c4d5e6f7a8b9102"),
          new mongoose.Types.ObjectId("65de1a2b3c4d5e6f7a8b9103")
        ]
      }
    });
    await db.collection('timeslots').drop();
  }
};