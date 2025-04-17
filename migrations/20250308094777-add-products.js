// migrations/XXXXXX-generate-mock-products.js

const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

// Liste d'images de nourriture haute qualité
const PREMIUM_FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format',  // Assiette healthy
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format',  // Burger
  'https://images.unsplash.com/photo-1565958011703-72f8580dce83?w=800&auto=format',  // Pâtes
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&auto=format',  // Petit-déjeuner
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&auto=format',  // Oeufs
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format'   // Salade
];

// Méthode pour obtenir des images premium
function getPremiumFoodImage() {
  return PREMIUM_FOOD_IMAGES[Math.floor(Math.random() * PREMIUM_FOOD_IMAGES.length)];
}

module.exports = {
  async up(db) {
    try {
      await db.collection("products").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }

    // Récupérer les catégories existantes
    const existingCategories = await db.collection('categories')
      .find({})
      .project({ _id: 1, name: 1 })
      .toArray();

    if (existingCategories.length === 0) {
      // throw new Error('Aucune catégorie trouvée dans la base de données');
      return
    }

    // Récupérer les restaurants existants
    const existingRestaurants = await db.collection('restaurants')
      .find({})
      .project({ _id: 1, name: 1 })
      .toArray();

    if (existingRestaurants.length === 0) {
      //throw new Error('Aucun restaurant trouvé dans la base de données');
      return
    }

    // Récupérer les variants existants
    const existingVariants = await db.collection('variants')
      .find({})
      .project({ _id: 1, name: 1 })
      .toArray();

    // Générer des produits fictifs
    const mockProducts = Array.from({ length: 50 }, (_, i) => {
      const category = faker.helpers.arrayElement(existingCategories);
      const restaurant = faker.helpers.arrayElement(existingRestaurants);
      const selectedVariants = existingVariants.length > 0 
        ? faker.helpers.arrayElements(existingVariants, faker.number.int({ min: 0, max: 3 }))
            .map(variant => ({ value: variant._id, label: variant.name }))
        : [];

      const hasDiscount = faker.datatype.boolean({ probability: 0.25 });
      const ratingAverage = faker.number.float({ min: 1, max: 5, precision: 0.1 });
      
      return {
        // name: faker.commerce.productName(),
        name: faker.food.dish(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price({ min: 2, max: 30 })),
        currency: 'EUR',
        image: getPremiumFoodImage(),
        category: category._id,
        categories: {
          value: category._id.toString(),
          label: category.name
        },
        restaurant: restaurant._id,
        restaurants: {
          value: restaurant._id.toString(),
          label: restaurant.name
        },
        availability: faker.datatype.boolean({ probability: 0.85 }),
        preparation_time: faker.number.int({ min: 5, max: 45 }),
        tags: faker.helpers.arrayElements(
          ['bio', 'végétarien', 'épicé', 'sans gluten', 'vegan', 'fait maison'],
          faker.number.int({ min: 0, max: 3 })
        ),
        ingredients: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => 
          faker.commerce.productMaterial()
        ),
        discount: {
          isActive: hasDiscount,
          percentage: hasDiscount ? faker.number.int({ min: 5, max: 25 }) : 0,
          startDate: hasDiscount ? faker.date.recent() : null,
          endDate: hasDiscount ? faker.date.soon({ days: 30 }) : null
        },
        rating: {
          average: ratingAverage,
          count: faker.number.int({ min: 0, max: 100 })
        },
        variants: selectedVariants,
        created_at: faker.date.past({ years: 1 }),
        updated_at: faker.date.recent({ days: 30 }),
      };
    });

    await db.collection('products').insertMany(mockProducts);
  },

  async down(db) {
    await db.collection('products').deleteMany({
      created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};

// const mongoose = require("mongoose");

// module.exports = {
//   async up(db, client) {
//     await db.collection('products').insertMany([
//       {
//         _id: new mongoose.Types.ObjectId('67cc29e162de2f9a5b4f439a'),
//         name: "Classic Burger",
//         description: "A delicious burger with steak, cheese, and house sauce.",
//         price: 8.99,
//         currency: "EUR",
//         image: "http://localhost:5000/api/uploads/1741850763739.jpg",
//         category: new mongoose.Types.ObjectId("67b6d643a2a5d0071e59befe"),
//         restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997ca"),
//         availability: true,
//         preparation_time: 15,
//         tags: ["burger", "meat", "fast food"],
//         ingredients: [
//           "Brioche bun",
//           "Ground beef steak",
//           "Cheddar cheese",
//           "Lettuce",
//           "Tomato",
//           "House sauce"
//         ],
//         discount: {
//           active: true,
//           percentage: 10
//         },
//         rating: {
//           average: 4.5,
//           count: 120
//         },
//         variants: [
//           { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9001"), label: "Double Steak (+2.00€)" },
//           { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9002"), label: "Gluten-Free Bun (+0.50€)" },
//           { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9003"), label: "Extra Bacon (+1.00€)" },
//           { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9004"), label: "Extra Cheese (+0.50€)" }
//         ],
//         created_at: new Date("2024-03-08T10:00:00Z"),
//         updated_at: new Date("2024-03-08T10:00:00Z")
//       },
//       {
//         _id: new mongoose.Types.ObjectId('67cc29e162de2f9a5b4f439b'),
//         name: "Margherita Pizza",
//         description: "Classic pizza with tomato sauce, mozzarella, and fresh basil.",
//         price: 12.50,
//         currency: "EUR",
//         image: "http://localhost:5000/api/uploads/1741851182203.jpg",
//         category: new mongoose.Types.ObjectId('67b6d643a2a5d0071e59beff'),
//         restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997ca"),
//         availability: true,
//         preparation_time: 20,
//         tags: ["pizza", "Italian", "cheese"],
//         ingredients: [
//           "Pizza dough",
//           "Tomato sauce",
//           "Mozzarella",
//           "Basil",
//           "Olive oil"
//         ],
//         discount: {
//           active: false,
//           percentage: 0
//         },
//         rating: {
//           average: 4.7,
//           count: 85
//         },
//         variants: [
//           { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9005"), label: "Small (20 cm) - 12.50€" },
//           { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9006"), label: "Medium (30 cm) - 14.50€" },
//           { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9007"), label: "Large (40 cm) - 16.50€" },
//           { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9008"), label: "Extra Cheese (+1.00€)" },
//           { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9009"), label: "Gluten-Free Dough (+0.50€)" },
//           { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9010"), label: "Spicy Version (+0.25€)" },
//           { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9011"), label: "Extra Basil (+0.10€)" }
//         ],
//         created_at: new Date("2024-03-08T10:05:00Z"),
//         updated_at: new Date("2024-03-08T10:05:00Z")
//       }
//     ]);
//   },

//   async down(db, client) {
//     await db.collection('products').deleteMany({});
//   }
// };
