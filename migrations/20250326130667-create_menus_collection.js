// migrations/XXXXXX-generate-mock-menus.js (remplacez XXXXXX par un timestamp)

const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

module.exports = {
  async up(db) {
    try {
      await db.collection("menus").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }

    // Récupérer les restaurants existants ou en créer si aucun n'existe
    let mockRestaurants = await db.collection('restaurants').find({}).toArray();
    if (mockRestaurants.length === 0) {
      mockRestaurants = Array.from({ length: 5 }, (_, i) => ({
        _id: new ObjectId(),
        name: faker.company.name(),
        address: faker.location.streetAddress(),
      }));
      await db.collection('restaurants').insertMany(mockRestaurants);
    }

    // Récupérer les produits existants ou en créer si aucun n'existe
    let mockProducts = await db.collection('products').find({}).toArray();
    if (mockProducts.length === 0) {
      mockProducts = Array.from({ length: 20 }, (_, i) => ({
        _id: new ObjectId(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
      }));
      await db.collection('products').insertMany(mockProducts);
    }

    // Générer des menus fictifs
    const mockMenus = Array.from({ length: 30 }, (_, i) => {
      const restaurant = faker.helpers.arrayElement(mockRestaurants);
      const selectedProducts = faker.helpers.arrayElements(
        mockProducts, 
        faker.number.int({ min: 2, max: 8 })
      ).map(product => ({
        value: product._id,
        label: product.name
      }));

      const hasDiscount = faker.datatype.boolean({ probability: 0.3 });
      const ratingAverage = faker.number.float({ min: 1, max: 5, precision: 0.1 });
      
      // Tableau d'images fixes intégré directement
      const foodImages = [
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38',
        'https://images.unsplash.com/photo-1565958011703-44f9829ba187',
        'https://images.unsplash.com/photo-1482049016688-2d3e1b311543',
        // 'https://images.unsplash.com/photo-1484723091739-30a097e8f929',
        // 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
        // 'https://images.unsplash.com/photo-1544025162-d76694265947',
        // 'https://images.unsplash.com/photo-1559847844-5315695dadae',
        // 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
        // 'https://images.unsplash.com/photo-1432139555190-58524dae6a55',
        // 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601',
        // 'https://images.unsplash.com/photo-1547592180-85f173990554',
        // 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2',
        // 'https://images.unsplash.com/photo-1467003909585-2f8a72700288',
        // 'https://images.unsplash.com/photo-1542838132-92c53300491e'
      ];
      
      return {
        name: faker.commerce.productName(),
        description: faker.lorem.sentence(),
        price: parseFloat(faker.commerce.price({ min: 5, max: 50 })),
        image: foodImages[i % foodImages.length], // Sélection cyclique dans le tableau
        restaurant: restaurant._id,
        restaurants: {
          value: restaurant._id.toString(),
          label: restaurant.name
        },
        availability: faker.datatype.boolean({ probability: 0.8 }),
        preparation_time: faker.number.int({ min: 10, max: 60 }),
        products: selectedProducts,
        discount: {
          active: hasDiscount,
          percentage: hasDiscount ? faker.number.int({ min: 5, max: 30 }) : 0
        },
        rating: {
          average: ratingAverage,
          count: faker.number.int({ min: 0, max: 100 })
        },
        created_at: faker.date.past({ years: 1 }),
        updated_at: faker.date.recent({ days: 30 }),
      };
    });

    // Insérer les menus dans la base de données
    await db.collection('menus').insertMany(mockMenus);
  },

  async down(db) {
    // Supprimer uniquement les données qui pourraient avoir été créées par cette migration
    await db.collection('menus').deleteMany({});
    // Ne pas supprimer les produits et restaurants existants
  }
};



// const mongoose = require("mongoose");

// module.exports = {
//   async up(db, client) {
//     // Insérer des menus dans la collection "menus"
//     await db.collection("menus").insertMany([
//       {
//         _id: new ObjectId("67cc30e162de2f9a5b4f5001"),
//         name: "Menu Burger Deluxe",
//         description: "Un menu complet avec burger, frites et boisson.",
//         price: 12.99,
//         image: "http://localhost:5000/api/uploads/menu_burger_deluxe.jpg",
//         restaurant: new ObjectId("67c69119d778f63b5e5997ca"),
//         availability: true,
//         preparation_time: 20,
//         products: [
//           { value: "67cc29e162de2f9a5b4f439a", label: "Classic Burger" },
//           { value: "67cc29e162de2f9a5b4f5002", label: "Frites" },
//           { value: "67cc29e162de2f9a5b4f5003", label: "Salade" },
//           { value: "67cc29e162de2f9a5b4f5004", label: "Coca-Cola" },
//           { value: "67cc29e162de2f9a5b4f5005", label: "Eau Minérale" }
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
//         _id: new ObjectId("67cc30e162de2f9a5b4f5006"),
//         name: "Menu Pizza Duo",
//         description: "Une pizza moyenne avec une boisson au choix.",
//         price: 14.99,
//         image: "http://localhost:5000/api/uploads/menu_pizza_duo.jpg",
//         restaurant: new ObjectId("67c69119d778f63b5e5997ca"),
//         availability: true,
//         preparation_time: 25,
//         products: [
//           { value: "67cc29e162de2f9a5b4f439b", label: "Margherita Pizza" },
//           { value: "67cc29e162de2f9a5b4f5007", label: "Pepperoni Pizza" },
//           { value: "67cc29e162de2f9a5b4f5004", label: "Coca-Cola" },
//           { value: "67cc29e162de2f9a5b4f5005", label: "Eau Minérale" }
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



// // const mongoose = require("mongoose");

// // module.exports = {
// //   async up(db, client) {
// //     // Insérer des menus dans la collection "menus"
// //     await db.collection("menus").insertMany([
// //       {
// //         _id: new ObjectId("67cc30e162de2f9a5b4f5001"),
// //         name: "Menu Burger Deluxe",
// //         description: "Un menu complet avec burger, frites et boisson.",
// //         price: 12.99,
// //         currency: "EUR",
// //         image: "http://localhost:5000/api/uploads/menu_burger_deluxe.jpg",
// //         restaurant: new ObjectId("67c69119d778f63b5e5997ca"),
// //         availability: true,
// //         preparation_time: 20,
// //         items: [
// //           {
// //             category: "Burger",
// //             required: true,
// //             choices: [
// //               {
// //                 product_id: new ObjectId("67cc29e162de2f9a5b4f439a"),
// //                 name: "Classic Burger"
// //               }
// //             ]
// //           },
// //           {
// //             category: "Accompagnement",
// //             required: true,
// //             choices: [
// //               {
// //                 product_id: new ObjectId("67cc29e162de2f9a5b4f5002"),
// //                 name: "Frites"
// //               },
// //               {
// //                 product_id: new ObjectId("67cc29e162de2f9a5b4f5003"),
// //                 name: "Salade"
// //               }
// //             ]
// //           },
// //           {
// //             category: "Boisson",
// //             required: true,
// //             choices: [
// //               {
// //                 product_id: new ObjectId("67cc29e162de2f9a5b4f5004"),
// //                 name: "Coca-Cola"
// //               },
// //               {
// //                 product_id: new ObjectId("67cc29e162de2f9a5b4f5005"),
// //                 name: "Eau Minérale"
// //               }
// //             ]
// //           }
// //         ],
// //         discount: {
// //           active: true,
// //           percentage: 10
// //         },
// //         rating: {
// //           average: 4.6,
// //           count: 90
// //         },
// //         created_at: new Date("2024-03-08T12:00:00Z"),
// //         updated_at: new Date("2024-03-08T12:00:00Z")
// //       },
// //       {
// //         _id: new ObjectId("67cc30e162de2f9a5b4f5006"),
// //         name: "Menu Pizza Duo",
// //         description: "Une pizza moyenne avec une boisson au choix.",
// //         price: 14.99,
// //         currency: "EUR",
// //         image: "http://localhost:5000/api/uploads/menu_pizza_duo.jpg",
// //         restaurant: new ObjectId("67c69119d778f63b5e5997ca"),
// //         availability: true,
// //         preparation_time: 25,
// //         items: [
// //           {
// //             category: "Pizza",
// //             required: true,
// //             choices: [
// //               {
// //                 product_id: new ObjectId("67cc29e162de2f9a5b4f439b"),
// //                 name: "Margherita Pizza"
// //               },
// //               {
// //                 product_id: new ObjectId("67cc29e162de2f9a5b4f5007"),
// //                 name: "Pepperoni Pizza"
// //               }
// //             ]
// //           },
// //           {
// //             category: "Boisson",
// //             required: true,
// //             choices: [
// //               {
// //                 product_id: new ObjectId("67cc29e162de2f9a5b4f5004"),
// //                 name: "Coca-Cola"
// //               },
// //               {
// //                 product_id: new ObjectId("67cc29e162de2f9a5b4f5005"),
// //                 name: "Eau Minérale"
// //               }
// //             ]
// //           }
// //         ],
// //         discount: {
// //           active: false,
// //           percentage: 0
// //         },
// //         rating: {
// //           average: 4.8,
// //           count: 75
// //         },
// //         created_at: new Date("2024-03-08T12:05:00Z"),
// //         updated_at: new Date("2024-03-08T12:05:00Z")
// //       }
// //     ]);
// //   },

// //   async down(db, client) {
// //     // Supprimer les menus ajoutés (rollback)
// //     await db.collection("menus").deleteMany({});
// //   }
// // };
