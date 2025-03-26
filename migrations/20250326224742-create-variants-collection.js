const mongoose = require("mongoose");

module.exports = {
  async up(db, client) {
    await db.collection('variants').insertMany([
      {
        _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9001"),
        name: "Double Steak",
        price: 2.00,
        currency: "EUR"
      },
      {
        _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9002"),
        name: "Gluten-Free Bun",
        price: 0.50,
        currency: "EUR"
      },
      {
        _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9003"),
        name: "Extra Bacon",
        price: 1.00,
        currency: "EUR"
      },
      {
        _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9004"),
        name: "Extra Cheese",
        price: 0.50,
        currency: "EUR"
      },
      {
        _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9005"),
        name: "Small (20 cm)",
        price: 12.50,
        currency: "EUR"
      },
      {
        _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9006"),
        name: "Medium (30 cm)",
        price: 14.50,
        currency: "EUR"
      },
      {
        _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9007"),
        name: "Large (40 cm)",
        price: 16.50,
        currency: "EUR"
      },
      {
        _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9008"),
        name: "Extra Cheese",
        price: 1.00,
        currency: "EUR"
      },
      {
        _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9009"),
        name: "Gluten-Free Dough",
        price: 0.50,
        currency: "EUR"
      },
      {
        _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9010"),
        name: "Spicy Version",
        price: 0.25,
        currency: "EUR"
      },
      {
        _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9011"),
        name: "Extra Basil",
        price: 0.10,
        currency: "EUR"
      }
    ]);
  },

  async down(db, client) {
    await db.collection('variants').deleteMany({});
  }
};
