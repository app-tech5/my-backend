// migrations/XXXXXX-generate-mock-restaurants.js

const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

// Liste d'images de restaurants réalistes (Unsplash)
const RESTAURANT_IMAGES = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
  'https://images.unsplash.com/photo-1581349485608-9469926a8e5e',
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b'
];

module.exports = {
  async up(db) {
    try {
      await db.collection("restaurants").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    // Récupérer les données existantes nécessaires (plus besoin de servicemodes)
    const categories = await db.collection('categories').find({}).project({ _id: 1, title: 1 }).toArray();
    const taxes = await db.collection('taxes').find({}).project({ _id: 1, name: 1, rate: 1 }).toArray();
    const users = await db.collection('users').find({}).project({ _id: 1, name: 1 }).toArray();

    if (!categories.length || !taxes.length || !users.length) {
      console.warn('⚠️  Avertissement : les collections categories, taxes ou users sont vides.');
      // throw new Error('Les collections categories, taxes ou users sont vides');
    }

    // Générer des restaurants fictifs
    const mockRestaurants = Array.from({ length: 20 }, (_, i) => {
      const selectedCategories = faker.helpers.arrayElements(
        categories,
        faker.number.int({ min: 1, max: 3 })
      ).map(cat => ({
        alias: faker.lorem.slug(),
        title: cat.title,
        image: faker.image.urlLoremFlickr({ category: 'food' }),
        value: cat._id,
        label: cat.title
      }));

      const tax = faker.helpers.arrayElement(taxes);
      const city = faker.location.city();
      const isClosed = faker.datatype.boolean({ probability: 0.1 });
      const priceLevel = faker.helpers.arrayElement(['$', '$$', '$$$', '$$$$']);
      const user = faker.helpers.arrayElement(users);
      
      // Sélection aléatoire d'une image de restaurant
      const restaurantImage = faker.helpers.arrayElement(RESTAURANT_IMAGES);
      
      return {
        name: faker.company.name(),
        alias: faker.lorem.slug(),
        id: faker.string.uuid(),
        description: faker.lorem.paragraph(),
        distance: faker.number.float({ min: 0.1, max: 15, precision: 0.1 }),
        rating: faker.number.float({ min: 1, max: 5, precision: 0.1 }),
        review_count: faker.number.int({ min: 0, max: 500 }),
        url: faker.internet.url(),
        display_phone: faker.phone.number(),
        phone: faker.phone.number(),
        price: priceLevel,
        is_closed: isClosed,
        isAvailableForDelivery: !isClosed && faker.datatype.boolean({ probability: 0.8 }),
        isActivated: faker.datatype.boolean({ probability: 0.9 }),
        image_url: restaurantImage + '?w=800&h=600&auto=format&fit=crop',
        image: restaurantImage + '?w=800&h=600&auto=format&fit=crop',
        theme: faker.helpers.arrayElement(['default', 'modern', 'classic']),
        country: faker.location.country(),
        city: city,
        address: `${faker.location.streetAddress()}, ${city}`,
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
        serviceModes: faker.helpers.arrayElement(["delivery", "pickup"]), // Changé ici
        categories: selectedCategories,
        collectTime: faker.number.int({ min: 10, max: 45 }),
        openingTime: `${faker.number.int({ min: 6, max: 9 })}:00`,
        closingTime: `${faker.number.int({ min: 20, max: 23 })}:00`,
        deliveryOptions: {
          deliveryType: faker.helpers.arrayElement(['standard', 'express', 'scheduled']),
          isDeliveryAvailable: faker.datatype.boolean({ probability: 0.8 }),
          isOrderAmountBasedFee: faker.datatype.boolean(),
          fixedFee: faker.number.float({ min: 1, max: 5, precision: 0.5 }),
          distanceFee: {
            base: faker.number.float({ min: 1, max: 3, precision: 0.5 }).toFixed(2),
            perKm: faker.number.float({ min: 0.2, max: 1.5, precision: 0.1 }).toFixed(2)
          },
          isFreeDelivery: {
            enabled: faker.datatype.boolean({ probability: 0.3 })
          },
          orderAmountThreshold: faker.number.int({ min: 15, max: 50 })
        },
        tax: {
          id: tax._id,
          location: city,
          rate: tax.rate,
          name: tax.name,
          value: tax._id,
          label: tax.name
        },
        commission_rate: faker.number.float({ min: 0, max: 15, precision: 0.5 }),
        reward: faker.lorem.words(3),
        createdAt: faker.date.past({ years: 1 }),
        users: {
          value: user._id,
          label: user.name || faker.person.fullName()
        }
      };
    });

    await db.collection('restaurants').insertMany(mockRestaurants);
  },

  async down(db) {
    await db.collection('restaurants').deleteMany({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};
// module.exports = {
//   async up(db, client) {
//     const restaurants = [
//       {
//         distance: 1200,
//         rating: 4.3,
//         coordinates: {
//           latitude: 40.7128,
//           longitude: -74.006,
//         },
//         review_count: 250,
//         serviceModes: [
//           { value: "pickup", label: "Pickup" },
//           { value: "delivery", label: "Delivery" },
//         ],
//         url: "https://www.goldenbowlnyc.com",
//         display_phone: "+1 212-555-6789",
//         phone: "+12125556789",
//         price: "$$",
//         name: "Golden Bowl",
//         alias: "golden-bowl-nyc",
//         location: {
//           country: "USA",
//           city: "New York",
//           address1: "123 Main Street",
//           address2: "Suite 101",
//           address3: "",
//           display_address: [
//             "123 Main Street",
//             "Suite 101",
//             "New York, NY 10001",
//             "USA",
//           ],
//           state: "NY",
//           zip_code: "10001",
//         },
//         id: "golden-bowl-nyc",
//         categories: [
//           {
//             alias: "asian",
//             title: "Asian",
//             image: "https://i.imgur.com/3QZQZQZ.jpg",
//             value: "asian",
//             label: "Asian",
//           },
//           {
//             alias: "noodles",
//             title: "Noodles",
//             image: "https://i.imgur.com/3QZQZQZ.jpg",
//             value: "noodles",
//             label: "Noodles",
//           },
//         ],
//         is_closed: false,
//         isAvailableForDelivery: true,
//         isActivated: true,
//         // image_url: "https://tse4.mm.bing.net/th?id=OIP.c2nqN8OX-m5j7NYbg7eHrQHaFj&w=355&h=355&c=7",
//         theme: "modern",
//         country: "USA",
//         city: "New York",
//         latitude: "40.7128",
//         longitude: "-74.0060",
//         description:
//           "A modern Asian restaurant specializing in noodles and fusion cuisine.",
//         image: "http://localhost:5000/api/uploads/1740075218890.jpg",
//         users: {
//           // name: "John Doe",
//           // phone: "+12125556789",
//           // email: "john.doe@goldenbowl.com",
//           // password: "hashedpassword123", // Remplace par un mot de passe hashé en production
//           value: "1234",
//           label: "john.doe@goldenbowl.com"
//         },
//         address: "123 Main Street, New York, NY 10001",
//         collectTime: 0.5,
//         openingTime: "10:00",
//         closingTime: "22:00",
//         // openingTime: new Date().setHours(10, 0, 0, 0), // 10:00 AM
//         // closingTime: new Date().setHours(22, 0, 0, 0), // 10:00 PM
//         createdAt: new Date(),
//         deliveryOptions: {
//           deliveryType: "fixed",
//           isDeliveryAvailable: true,
//           isOrderAmountBasedFee: true,
//           fixedFee: 1.00,
//           orderAmountThreshold: 20,
//         },
//         tax: {
//           id: "tax-nyc-1",
//           location: "New York",
//           rate: "8.875%",
//           name: "NY Sales Tax",
//           value: "8.875",
//           label: "Sales Tax",
//         },
//         commission_rate: 15,
//         reward: "10% off on first order",
//       },
//       {
//         distance: 800,
//         rating: 4.6,
//         coordinates: {
//           latitude: 34.0522,
//           longitude: -118.2437,
//         },
//         review_count: 180,
//         serviceModes: [{ value: "pickup", label: "Pickup" }],
//         url: "https://www.sunnysidegrill.com",
//         display_phone: "+1 323-555-4321",
//         phone: "+13235554321",
//         price: "$$$",
//         name: "SunnySide Grill",
//         alias: "sunnyside-grill-la",
//         location: {
//           country: "USA",
//           city: "Los Angeles",
//           address1: "456 Sunset Boulevard",
//           address2: "",
//           address3: "",
//           display_address: [
//             "456 Sunset Boulevard",
//             "Los Angeles, CA 90028",
//             "USA",
//           ],
//           state: "CA",
//           zip_code: "90028",
//         },
//         id: "sunnyside-grill-la",
//         categories: [
//           {
//             alias: "american",
//             title: "American",
//             image: "https://i.imgur.com/4R4R4R4.jpg",
//             value: "american",
//             label: "American",
//           },
//           {
//             alias: "bbq",
//             title: "BBQ",
//             image: "https://i.imgur.com/4R4R4R4.jpg",
//             value: "bbq",
//             label: "BBQ",
//           },
//         ],
//         is_closed: false,
//         isAvailableForDelivery: true,
//         isActivated: true,
//         // image_url: "https://tse4.mm.bing.net/th?id=OIP.TT09h8vKfF-coEAFlddwFAHaD5&w=249&h=249&c=7",
//         theme: "rustic",
//         country: "USA",
//         city: "Los Angeles",
//         latitude: "34.0522",
//         longitude: "-118.2437",
//         description:
//           "A rustic American grill famous for its BBQ and hearty meals.",
//         image: "http://localhost:5000/api/uploads/1740075685913.jpg",
//         users: {
//           // name: "Jane Smith",
//           // phone: "+13235554321",
//           // email: "jane.smith@sunnysidegrill.com",
//           // password: "hashedpassword456", // Remplace par un mot de passe hashé en production
//           value: "12345",
//           label: "jane.smith@sunnysidegrill.com"
          
//         },
//         address: "456 Sunset Boulevard, Los Angeles, CA 90028",
//         collectTime: 0.75,
//         openingTime: "11:00",
//         closingTime: "21:00",
//         // openingTime: new Date().setHours(11, 0, 0, 0), // 10:00 AM
//         // closingTime: new Date().setHours(21, 0, 0, 0), // 10:00 PM
//         createdAt: new Date(),
//         deliveryOptions: {
//           deliveryType: "distance",
//           isDeliveryAvailable: true,
//           isOrderAmountBasedFee: true,
//           distanceFee: {
//             base: "1",
//             perKm: "2"
//           },
//           orderAmountThreshold: 40,
//           // deliveryType: "standard",
//           // isDeliveryAvailable: true,
//           // isOrderAmountBasedFee: true,
//           // fixedFee: 5.00,
//           // orderAmountThreshold: 20,
//         },
//         tax: {
//           id: "tax-la-1",
//           location: "Los Angeles",
//           rate: "9.50%",
//           name: "CA Sales Tax",
//           value: "9.50",
//           label: "Sales Tax",
//         },
//         commission_rate: 12,
//         reward: "Free dessert on orders above $50",
//       },
//       {
//         distance: 1500,
//         rating: 4.8,
//         coordinates: {
//           latitude: 37.7749,
//           longitude: -122.4194,
//         },
//         review_count: 320,
//         serviceModes: [{ value: "delivery", label: "Delivery" }],
//         url: "https://www.oceanbreezeseafood.com",
//         display_phone: "+1 415-555-9876",
//         phone: "+14155559876",
//         price: "$$$$",
//         name: "Ocean Breeze Seafood",
//         alias: "ocean-breeze-seafood-sf",
//         location: {
//           country: "USA",
//           city: "San Francisco",
//           address1: "789 Ocean Avenue",
//           address2: "",
//           address3: "",
//           display_address: [
//             "789 Ocean Avenue",
//             "San Francisco, CA 94112",
//             "USA",
//           ],
//           state: "CA",
//           zip_code: "94112",
//         },
//         id: "ocean-breeze-seafood-sf",
//         categories: [
//           {
//             alias: "seafood",
//             title: "Seafood",
//             image: "https://i.imgur.com/5S5S5S5.jpg",
//             value: "seafood",
//             label: "Seafood",
//           },
//           {
//             alias: "fine-dining",
//             title: "Fine Dining",
//             image: "https://i.imgur.com/5S5S5S5.jpg",
//             value: "fine-dining",
//             label: "Fine Dining",
//           },
//         ],
//         is_closed: false,
//         isAvailableForDelivery: true,
//         isActivated: true,
//         // image_url: "https://tse2.mm.bing.net/th?id=OIP.vgEvDaozlxoa8nUJvhxRSgHaE8&w=316&h=316&c=7",
//         theme: "luxury",
//         country: "USA",
//         city: "San Francisco",
//         latitude: "37.7749",
//         longitude: "-122.4194",
//         description:
//           "A luxury seafood restaurant offering the finest dining experience.",
//         image: "http://localhost:5000/api/uploads/1740075783437.jpg",
//         users: {
//           // name: "Michael Brown",
//           // phone: "+14155559876",
//           // email: "michael.brown@oceanbreeze.com",
//           // password: "hashedpassword789", // Remplace par un mot de passe hashé en production
//           value: "123",
//           label: "michael.brown@oceanbreeze.com"
//         },
//         address: "789 Ocean Avenue, San Francisco, CA 94112",
//         collectTime: 1,
//         openingTime: "12:00",
//         closingTime: "23:00",
//         // openingTime: new Date().setHours(12, 0, 0, 0), // 10:00 AM
//         // closingTime: new Date().setHours(23, 0, 0, 0), // 10:00 PM
//         createdAt: new Date(),
//         deliveryOptions: {
//           deliveryType: "free",
//           isDeliveryAvailable: true,
//           isOrderAmountBasedFee: false,
//           isFreeDelivery: {
//             enabled: false
//           },
//         },
//         tax: {
//           id: "tax-sf-1",
//           location: "San Francisco",
//           rate: "8.50%",
//           name: "SF Sales Tax",
//           value: "8.50",
//           label: "Sales Tax",
//         },
//         commission_rate: 18,
//         reward: "Complimentary wine on orders above $100",
//       },
//     ];

//     await db.collection("restaurants").insertMany(restaurants);
//   },

//   async down(db, client) {
//     await db.collection("restaurants").deleteMany({
//       id: {
//         $in: [
//           "golden-bowl-nyc",
//           "sunnyside-grill-la",
//           "ocean-breeze-seafood-sf",
//         ],
//       },
//     });
//   },
// };
