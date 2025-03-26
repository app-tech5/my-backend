// const ObjectId = require('bson-objectid');
const mongoose = require("mongoose");
module.exports = {
  async up(db, client) {
    const orders = [
      {
        _id: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7c2"),
        user: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d6"),
        restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997ca"),
        driver: new mongoose.Types.ObjectId("67e19dd963e6923ec5c0e191"),
        items: [
          {
            type: "Product",
            item: new mongoose.Types.ObjectId("67cc29e162de2f9a5b4f439a"),
            quantity: 2,
            price: 10,
            extras: [
              {
                productId: new mongoose.Types.ObjectId("67cc29e162de2f9a5b4f439b"),
                name: "Fromage supplémentaire",
                price: 1.5, 
                quantity: 2,
              },
              {
                productId: new mongoose.Types.ObjectId("67cc29e162de2f9a5b4f439a"),
                name: "Bacon",
                price: 2.0,
                quantity: 3,
              },
            ],
            variants:[
              {
                name: "Double Steak",
                price: 10.99,
              },
              {
                name: "Extra Cheese",
                price: 9.49,
              }
            ]
          },
          {
            type: "Product",
            item: new mongoose.Types.ObjectId("67cc29e162de2f9a5b4f439b"),
            quantity: 2,
            price: 14,
          },
          // {
          //   menuItemId: "menuItem1",
          //   product: new mongoose.Types.ObjectId('67cc29e162de2f9a5b4f439a'),
          //   // name: "Pizza Margherita",
          //   // quantity: 2,
          //   // price: 10,
          // },
          // {
          //   menuItemId: "menuItem1",
          //   product: new mongoose.Types.ObjectId('67cc29e162de2f9a5b4f439b'),
          //   // name: "Pizza 1 Margherita",
          //   // quantity: 2,
          //   // price: 12,
          // },
        ],
        // totalPrice: 20,
        status: "pending",
        payment: {
          method: "credit_card",
          status: "pending",
          transactionId: "txn_123456",
        },
        delivery: {
          type: "delivery",
          address: "123 Main Street, New York, NY 10001",
          estimatedTime: new Date(),
          deliveryFee: 5,
          //riderId: null,
        },
        subtotal: 25.49,
        tax: {
          rate: 0.1,
          // amount: 2.55,
        },
        //currency: "EUR",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7c3"),
        user: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d6"), // Remplacez par une chaîne de caractères
        restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997ca"), // Remplacez par une chaîne de caractères
        driver: new mongoose.Types.ObjectId("67d71a0ca4b0791fb7e64a94"),
        items: [
          {
            type: "Product",
            item: new mongoose.Types.ObjectId("67cc29e162de2f9a5b4f439a"),
            quantity: 2,
            price: 10,

            // menuItemId: "menuItem2", // Remplacez par une chaîne de caractères
            // product: new mongoose.Types.ObjectId('67cc29e162de2f9a5b4f439a'),
            // // name: "Burger",
            // // quantity: 1,
            // // price: 8,
          },
        ],
        totalPrice: 8,
        status: "preparing",
        payment: {
          method: "mobile_money",
          status: "paid",
          transactionId: "txn_654321",
        },
        delivery: {
          type: "pickup",
          address: "123 Main Street, New York, NY 10001",
          estimatedTime: new Date(), // Gardez les dates comme des objets Date
          deliveryFee: 0,
          //riderId: null, // ou une chaîne de caractères si un rider est associé
        },
        subtotal: 25.49,
        tax: {
          rate: 0.1,
          // amount: 2.55,
        },
        // currency: "EUR",
        createdAt: new Date(), // Gardez les dates comme des objets Date
        updatedAt: new Date(), // Gardez les dates comme des objets Date
      },
      {
        _id: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7c4"),
        user: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d6"), // Remplacez par une chaîne de caractères
        restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997cb"), // Remplacez par une chaîne de caractères
        driver: new mongoose.Types.ObjectId("67d71a0ca4b0791fb7e64a95"),
        items: [
          {
            type: "Product",
            item: new mongoose.Types.ObjectId("67cc29e162de2f9a5b4f439b"),
            quantity: 2,
            price: 8,
            // menuItemId: "menuItem3", // Remplacez par une chaîne de caractères
            // product: new mongoose.Types.ObjectId('67cc29e162de2f9a5b4f439b'),
            // // name: "Sushi",
            // // quantity: 3,
            // // price: 12,
          },
        ],
        totalPrice: 36,
        status: "out_for_delivery",
        payment: {
          method: "cash",
          status: "pending",
          transactionId: "txn_987654",
        },
        delivery: {
          type: "delivery",
          address: "123 Main Street, New York, NY 10001",
          estimatedTime: new Date(), // Gardez les dates comme des objets Date
          deliveryFee: 7,
          //riderId: "rider1", // Remplacez par une chaîne de caractères
        },
        subtotal: 25.49,
        tax: {
          rate: 0.1,
          // amount: 2.55,
        },
        // currency: "EUR",
        createdAt: new Date(), // Gardez les dates comme des objets Date
        updatedAt: new Date(), // Gardez les dates comme des objets Date
      },
    ];

    await db.collection("orders").insertMany(orders);
  },

  async down(db, client) {
    await db.collection("orders").deleteMany({});
  },
};
