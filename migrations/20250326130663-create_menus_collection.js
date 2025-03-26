const mongoose = require("mongoose");

module.exports = {
  async up(db, client) {
    // Insérer des menus dans la collection "menus"
    await db.collection("menus").insertMany([
      {
        _id: new mongoose.Types.ObjectId("67cc30e162de2f9a5b4f5001"),
        name: "Menu Burger Deluxe",
        description: "Un menu complet avec burger, frites et boisson.",
        price: 12.99,
        image: "http://localhost:5000/api/uploads/menu_burger_deluxe.jpg",
        restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997ca"),
        availability: true,
        preparation_time: 20,
        products: [
          { value: "67cc29e162de2f9a5b4f439a", label: "Classic Burger" },
          { value: "67cc29e162de2f9a5b4f5002", label: "Frites" },
          { value: "67cc29e162de2f9a5b4f5003", label: "Salade" },
          { value: "67cc29e162de2f9a5b4f5004", label: "Coca-Cola" },
          { value: "67cc29e162de2f9a5b4f5005", label: "Eau Minérale" }
        ],
        discount: {
          active: true,
          percentage: 10
        },
        rating: {
          average: 4.6,
          count: 90
        },
        created_at: new Date("2024-03-08T12:00:00Z"),
        updated_at: new Date("2024-03-08T12:00:00Z")
      },
      {
        _id: new mongoose.Types.ObjectId("67cc30e162de2f9a5b4f5006"),
        name: "Menu Pizza Duo",
        description: "Une pizza moyenne avec une boisson au choix.",
        price: 14.99,
        image: "http://localhost:5000/api/uploads/menu_pizza_duo.jpg",
        restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997ca"),
        availability: true,
        preparation_time: 25,
        products: [
          { value: "67cc29e162de2f9a5b4f439b", label: "Margherita Pizza" },
          { value: "67cc29e162de2f9a5b4f5007", label: "Pepperoni Pizza" },
          { value: "67cc29e162de2f9a5b4f5004", label: "Coca-Cola" },
          { value: "67cc29e162de2f9a5b4f5005", label: "Eau Minérale" }
        ],
        discount: {
          active: false,
          percentage: 0
        },
        rating: {
          average: 4.8,
          count: 75
        },
        created_at: new Date("2024-03-08T12:05:00Z"),
        updated_at: new Date("2024-03-08T12:05:00Z")
      }
    ]);
  },

  async down(db, client) {
    // Supprimer les menus ajoutés (rollback)
    await db.collection("menus").deleteMany({});
  }
};



// const mongoose = require("mongoose");

// module.exports = {
//   async up(db, client) {
//     // Insérer des menus dans la collection "menus"
//     await db.collection("menus").insertMany([
//       {
//         _id: new mongoose.Types.ObjectId("67cc30e162de2f9a5b4f5001"),
//         name: "Menu Burger Deluxe",
//         description: "Un menu complet avec burger, frites et boisson.",
//         price: 12.99,
//         currency: "EUR",
//         image: "http://localhost:5000/api/uploads/menu_burger_deluxe.jpg",
//         restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997ca"),
//         availability: true,
//         preparation_time: 20,
//         items: [
//           {
//             category: "Burger",
//             required: true,
//             choices: [
//               {
//                 product_id: new mongoose.Types.ObjectId("67cc29e162de2f9a5b4f439a"),
//                 name: "Classic Burger"
//               }
//             ]
//           },
//           {
//             category: "Accompagnement",
//             required: true,
//             choices: [
//               {
//                 product_id: new mongoose.Types.ObjectId("67cc29e162de2f9a5b4f5002"),
//                 name: "Frites"
//               },
//               {
//                 product_id: new mongoose.Types.ObjectId("67cc29e162de2f9a5b4f5003"),
//                 name: "Salade"
//               }
//             ]
//           },
//           {
//             category: "Boisson",
//             required: true,
//             choices: [
//               {
//                 product_id: new mongoose.Types.ObjectId("67cc29e162de2f9a5b4f5004"),
//                 name: "Coca-Cola"
//               },
//               {
//                 product_id: new mongoose.Types.ObjectId("67cc29e162de2f9a5b4f5005"),
//                 name: "Eau Minérale"
//               }
//             ]
//           }
//         ],
//         discount: {
//           active: true,
//           percentage: 10
//         },
//         rating: {
//           average: 4.6,
//           count: 90
//         },
//         created_at: new Date("2024-03-08T12:00:00Z"),
//         updated_at: new Date("2024-03-08T12:00:00Z")
//       },
//       {
//         _id: new mongoose.Types.ObjectId("67cc30e162de2f9a5b4f5006"),
//         name: "Menu Pizza Duo",
//         description: "Une pizza moyenne avec une boisson au choix.",
//         price: 14.99,
//         currency: "EUR",
//         image: "http://localhost:5000/api/uploads/menu_pizza_duo.jpg",
//         restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997ca"),
//         availability: true,
//         preparation_time: 25,
//         items: [
//           {
//             category: "Pizza",
//             required: true,
//             choices: [
//               {
//                 product_id: new mongoose.Types.ObjectId("67cc29e162de2f9a5b4f439b"),
//                 name: "Margherita Pizza"
//               },
//               {
//                 product_id: new mongoose.Types.ObjectId("67cc29e162de2f9a5b4f5007"),
//                 name: "Pepperoni Pizza"
//               }
//             ]
//           },
//           {
//             category: "Boisson",
//             required: true,
//             choices: [
//               {
//                 product_id: new mongoose.Types.ObjectId("67cc29e162de2f9a5b4f5004"),
//                 name: "Coca-Cola"
//               },
//               {
//                 product_id: new mongoose.Types.ObjectId("67cc29e162de2f9a5b4f5005"),
//                 name: "Eau Minérale"
//               }
//             ]
//           }
//         ],
//         discount: {
//           active: false,
//           percentage: 0
//         },
//         rating: {
//           average: 4.8,
//           count: 75
//         },
//         created_at: new Date("2024-03-08T12:05:00Z"),
//         updated_at: new Date("2024-03-08T12:05:00Z")
//       }
//     ]);
//   },

//   async down(db, client) {
//     // Supprimer les menus ajoutés (rollback)
//     await db.collection("menus").deleteMany({});
//   }
// };
