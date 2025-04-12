// migrations/XXXXXX-generate-mock-orders.js

const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

module.exports = {
  async up(db) {
    try {
      await db.collection("orders").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    // Récupérer les données existantes nécessaires
    const [users, restaurants, drivers, products, menus] = await Promise.all([
      db.collection('users').find({}).project({ _id: 1, name: 1 }).toArray(),
      db.collection('restaurants').find({}).project({ _id: 1, name: 1 }).toArray(),
      db.collection('drivers').find({}).project({ _id: 1, name: 1 }).toArray(),
      db.collection('products').find({}).project({ _id: 1, name: 1, price: 1 }).toArray(),
      db.collection('menus').find({}).project({ _id: 1, name: 1, price: 1, image: 1 }).toArray()
    ]);

    // // Vérifications des données
    // if (users.length === 0) throw new Error('Aucun utilisateur trouvé');
    // if (restaurants.length === 0) throw new Error('Aucun restaurant trouvé');
    // if (drivers.length === 0) throw new Error('Aucun driver trouvé');
    // if (products.length === 0) throw new Error('Aucun produit trouvé');
    // if (menus.length === 0) throw new Error('Aucun menu trouvé');

    // Vérifications des données
    if (!users.length || !restaurants.length || !drivers.length || !products.length || !menus.length) {
      console.log("⏭  Migration sautée : certaines collections nécessaires sont vides.");
      return; // skip toute la migration
    }

    // Générer des commandes fictives
    const mockOrders = Array.from({ length: 50 }, (_, i) => {
      const user = faker.helpers.arrayElement(users);
      const restaurant = faker.helpers.arrayElement(restaurants);
      const driver = faker.helpers.arrayElement(drivers);
      
      // Générer 1 à 5 items par commande
      const items = Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => {
        const isMenu = faker.datatype.boolean({ probability: 0.6 }); // 60% de chance d'être un menu
        const item = isMenu 
          ? faker.helpers.arrayElement(menus) 
          : faker.helpers.arrayElement(products);
        
        const quantity = faker.number.int({ min: 1, max: 3 });
        const basePrice = isMenu ? item.price : item.price;
        const itemTotal = basePrice * quantity;

        // Générer des extras (0 à 3)
        const extras = Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => {
          const product = faker.helpers.arrayElement(products);
          const extraQuantity = faker.number.int({ min: 1, max: 2 });
          return {
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: extraQuantity
          };
        });

        // Générer des variants (0 à 2)
        const variants = Array.from({ length: faker.number.int({ min: 0, max: 2 }) }, () => ({
          name: faker.commerce.productAdjective(),
          price: faker.number.float({ min: 1, max: 5, precision: 0.5 }),
          extra: faker.number.float({ min: 0, max: 3, precision: 0.5 }),
          size: faker.helpers.arrayElement(['S', 'M', 'L', 'XL'])
        }));

        // Calcul du total avec extras et variants
        const extrasTotal = extras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0);
        const variantsTotal = variants.reduce((sum, variant) => sum + variant.price, 0);
        const total = itemTotal + extrasTotal + variantsTotal;

        return {
          type: isMenu ? 'Menu' : 'Product',
          item: item._id,
          name: item.name,
          image: item.image || faker.image.urlLoremFlickr({ category: 'food' }),
          price: basePrice,
          currency: 'USD',
          quantity,
          extras,
          variants,
          total
        };
      });

      // Calcul des totaux
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const taxRate = 0.18; // 18% de TVA
      const taxAmount = subtotal * taxRate;
      const deliveryFee = faker.number.float({ min: 500, max: 2000, precision: 100 });
      const totalPrice = subtotal + taxAmount + deliveryFee;

      // Statut aléatoire
      const status = faker.helpers.arrayElement([
        'pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'
      ]);

      return {
        user: user._id,
        restaurant: restaurant._id,
        driver: driver._id,
        items,
        totalPrice,
        subtotal,
        tax: {
          rate: taxRate,
          amount: taxAmount
        },
        status,
        payment: {
          method: faker.helpers.arrayElement(['credit_card', 'mobile_money', 'cash']),
          status: status === 'cancelled' ? 'failed' : 
                 ['delivered', 'out_for_delivery'].includes(status) ? 'paid' : 'pending',
          transactionId: faker.string.uuid()
        },
        delivery: {
          type: faker.helpers.arrayElement(['delivery', 'pickup']),
          address: faker.location.streetAddress(),
          estimatedTime: faker.date.soon({ days: 1 }),
          deliveryFee: deliveryFee
        },
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent({ days: 30 })
      };
    });

    await db.collection('orders').insertMany(mockOrders);
  },

  async down(db) {
    // Supprimer uniquement les commandes récemment créées
    await db.collection('orders').deleteMany({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};

// migrations/YYYYMMDDHHMMSS-mock-orders.js
// module.exports = {
//   async up(db, client) {
//     const orders = [];
//     const users = await db.collection("users").find().toArray();
//     const restaurants = await db.collection("restaurants").find().toArray();
//     const drivers = await db.collection("drivers").find().toArray();
//     const products = await db.collection("products").find().toArray();

//     function getRandomItem(arr) {
//       return arr[Math.floor(Math.random() * arr.length)];
//     }

//     for (let i = 0; i < 40; i++) {
//       const user = getRandomItem(users);
//       const restaurant = getRandomItem(restaurants);
//       const driver = getRandomItem(drivers);
//       const items = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => {
//         const product = getRandomItem(products);
//         return {
//           type: "Product",
//           item: product._id,
//           name: product.name,
//           image: product.image,
//           price: product.price,
//           currency: "XAF",
//           quantity: Math.floor(Math.random() * 3) + 1,
//           extras: [],
//           variants: [],
//           total: product.price * (Math.floor(Math.random() * 3) + 1),
//         };
//       });

//       const subtotal = items.reduce((sum, item) => sum + item.total, 0);
//       const taxRate = 0.1;
//       const taxAmount = subtotal * taxRate;
//       const totalPrice = subtotal + taxAmount;

//       orders.push({
//         user: user._id,
//         restaurant: restaurant._id,
//         driver: driver._id,
//         items,
//         subtotal,
//         tax: { rate: taxRate, amount: taxAmount },
//         totalPrice,
//         status: "pending",
//         payment: {
//           method: "mobile_money",
//           status: "pending",
//           transactionId: null,
//         },
//         delivery: {
//           type: "delivery",
//           address: user.address,
//           estimatedTime: new Date(Date.now() + 30 * 60000),
//           deliveryFee: 500,
//         },
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       });
//     }

//     await db.collection("orders").insertMany(orders);
//   },

//   async down(db, client) {
//     await db.collection("orders").deleteMany({});
//   },
// };

// // const ObjectId = require('bson-objectid');
// const mongoose = require("mongoose");
// module.exports = {
//   async up(db, client) {
//     const orders = [
//       {
//         _id: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7c2"),
//         user: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d6"),
//         restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997ca"),
//         driver: new mongoose.Types.ObjectId("67e19dd963e6923ec5c0e191"),
//         items: [
//           {
//             type: "Product",
//             item: new mongoose.Types.ObjectId("67cc29e162de2f9a5b4f439a"),
//             quantity: 2,
//             price: 10,
//             extras: [
//               {
//                 productId: new mongoose.Types.ObjectId("67cc29e162de2f9a5b4f439b"),
//                 name: "Fromage supplémentaire",
//                 price: 1.5, 
//                 quantity: 2,
//               },
//               {
//                 productId: new mongoose.Types.ObjectId("67cc29e162de2f9a5b4f439a"),
//                 name: "Bacon",
//                 price: 2.0,
//                 quantity: 3,
//               },
//             ],
//             variants:[
//               {
//                 name: "Double Steak",
//                 price: 10.99,
//               },
//               {
//                 name: "Extra Cheese",
//                 price: 9.49,
//               }
//             ]
//           },
//           {
//             type: "Product",
//             item: new mongoose.Types.ObjectId("67cc29e162de2f9a5b4f439b"),
//             quantity: 2,
//             price: 14,
//           },
//         ],
//         // totalPrice: 20,
//         status: "pending",
//         payment: {
//           method: "credit_card",
//           status: "pending",
//           transactionId: "txn_123456",
//         },
//         delivery: {
//           type: "delivery",
//           address: "123 Main Street, New York, NY 10001",
//           estimatedTime: new Date(),
//           deliveryFee: 5,
//           //riderId: null,
//         },
//         subtotal: 25.49,
//         tax: {
//           rate: 0.1,
//           // amount: 2.55,
//         },
//         //currency: "EUR",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         _id: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7c3"),
//         user: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d6"), // Remplacez par une chaîne de caractères
//         restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997ca"), // Remplacez par une chaîne de caractères
//         driver: new mongoose.Types.ObjectId("67d71a0ca4b0791fb7e64a94"),
//         items: [
//           {
//             type: "Product",
//             item: new mongoose.Types.ObjectId("67cc29e162de2f9a5b4f439a"),
//             quantity: 2,
//             price: 10,
//           },
//         ],
//         totalPrice: 8,
//         status: "preparing",
//         payment: {
//           method: "mobile_money",
//           status: "paid",
//           transactionId: "txn_654321",
//         },
//         delivery: {
//           type: "pickup",
//           address: "123 Main Street, New York, NY 10001",
//           estimatedTime: new Date(), // Gardez les dates comme des objets Date
//           deliveryFee: 0,
//           //riderId: null, // ou une chaîne de caractères si un rider est associé
//         },
//         subtotal: 25.49,
//         tax: {
//           rate: 0.1,
//           // amount: 2.55,
//         },
//         // currency: "EUR",
//         createdAt: new Date(), // Gardez les dates comme des objets Date
//         updatedAt: new Date(), // Gardez les dates comme des objets Date
//       },
//       {
//         _id: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7c4"),
//         user: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d6"), // Remplacez par une chaîne de caractères
//         restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997cb"), // Remplacez par une chaîne de caractères
//         driver: new mongoose.Types.ObjectId("67d71a0ca4b0791fb7e64a95"),
//         items: [
//           {
//             type: "Product",
//             item: new mongoose.Types.ObjectId("67cc29e162de2f9a5b4f439b"),
//             quantity: 2,
//             price: 8,
//           },
//         ],
//         totalPrice: 36,
//         status: "out_for_delivery",
//         payment: {
//           method: "cash",
//           status: "pending",
//           transactionId: "txn_987654",
//         },
//         delivery: {
//           type: "delivery",
//           address: "123 Main Street, New York, NY 10001",
//           estimatedTime: new Date(), // Gardez les dates comme des objets Date
//           deliveryFee: 7,
//           //riderId: "rider1", // Remplacez par une chaîne de caractères
//         },
//         subtotal: 25.49,
//         tax: {
//           rate: 0.1,
//           // amount: 2.55,
//         },
//         // currency: "EUR",
//         createdAt: new Date(), // Gardez les dates comme des objets Date
//         updatedAt: new Date(), // Gardez les dates comme des objets Date
//       },
//     ];

//     await db.collection("orders").insertMany(orders);
//   },

//   async down(db, client) {
//     await db.collection("orders").deleteMany({});
//   },
// };
