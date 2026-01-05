const mongoose = require("mongoose");
const { faker } = require('@faker-js/faker');
const { ObjectId } = require('mongodb');

module.exports = {
  async up(db, client) {
    try {
      await db.collection("earnings").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    // Récupération des IDs existants
    const restaurants = await db.collection("restaurants").find({}).project({ _id: 1 }).toArray();
    const drivers = await db.collection("drivers").find({}).project({ _id: 1 }).toArray();

    if (restaurants.length === 0 || drivers.length === 0) {
      throw new Error("Les collections restaurants ou drivers sont vides");
    }

    // Fonction pour générer des données mockées avec les vrais IDs
    const generateMockEarnings = () => {
      const monthsToGenerate = 15;
      const earnings = [];
      const currentDate = new Date();

      for (let i = 0; i < monthsToGenerate; i++) {
        
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
        
        // Génération des transactions (2-5 par mois)
        const transactionCount = faker.number.int({ min: 2, max: 5 });
        const transactions = [];
        let totalAmount = 0;

        for (let j = 0; j < transactionCount; j++) {
          const amount = faker.number.int({ min: 100, max: 1000 });
          const randomRestaurant = faker.helpers.arrayElement(restaurants);
          
          transactions.push({
            _id: new ObjectId(),
            date: faker.date.between({ from: startDate, to: endDate }),
            restaurant: randomRestaurant._id,
            amount: amount,
            commission: amount * 0.2,
            delivery_fee: amount * 0.1,
            status: "completed"
          });
          totalAmount += amount;
        }

        // Calcul des répartitions
        const platformCommission = totalAmount * 0.2;
        const deliveryEarnings = totalAmount * 0.1;
        const taxes = totalAmount * 0.05;
        const restaurantEarnings = totalAmount - platformCommission - deliveryEarnings - taxes;

        // Sélection aléatoire d'un destinataire (restaurant ou driver)
        const recipientType = faker.helpers.arrayElement(["Driver", "Restaurant"]);
        const recipient = recipientType === "Driver" 
          ? faker.helpers.arrayElement(drivers)._id
          : faker.helpers.arrayElement(restaurants)._id;

        earnings.push({
          _id: new ObjectId(),
          total_earnings: totalAmount,
          currency: "USD",
          time_period: {
            start_date: startDate,
            end_date: endDate
          },
          breakdown: {
            platform_commission: platformCommission,
            restaurant_earnings: restaurantEarnings,
            delivery_earnings: deliveryEarnings,
            taxes: taxes
          },
          transactions: transactions,
          payouts: [{
            _id: new ObjectId(),
            date: faker.date.between({ 
              from: startDate, 
              to: new Date(endDate.getTime() + 15 * 24 * 60 * 60 * 1000)
            }),
            recipient: recipient,
            recipientType: recipientType,
            // amount: restaurantEarnings,
            amount: recipientType === "Restaurant" ? restaurantEarnings : deliveryEarnings,
            status: faker.helpers.arrayElement(["completed", "pending"])
          }],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      return earnings;
    };

    // Génération et insertion des données
    const mockEarnings = generateMockEarnings();
    await db.collection("earnings").insertMany(mockEarnings);
  },

  async down(db, client) {
    await db.collection("earnings").deleteMany({});
  }
};



// const mongoose = require("mongoose");
// const { faker } = require('@faker-js/faker');

// function generateMockEarnings() {
//   const monthsToGenerate = 6;
//   const earnings = [];
//   const currentDate = new Date();

//   for (let i = 0; i < monthsToGenerate; i++) {
//     const monthDate = new Date(currentDate);
//     monthDate.setMonth(currentDate.getMonth() - i);
    
//     const startDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
//     const endDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
//     // Génération des transactions (2-5 par mois)
//     const transactionCount = faker.datatype.number({ min: 2, max: 5 });
//     const transactions = [];
//     let totalAmount = 0;

//     for (let j = 0; j < transactionCount; j++) {
//       const amount = faker.datatype.number({ min: 100, max: 1000 });
//       transactions.push({
//         _id: new ObjectId(),
//         date: faker.date.between(startDate, endDate),
//         restaurant: new ObjectId(),
//         amount: amount,
//         commission: amount * 0.2,
//         delivery_fee: amount * 0.1,
//         status: "completed"
//       });
//       totalAmount += amount;
//     }

//     // Calcul des répartitions
//     const platformCommission = totalAmount * 0.2;
//     const deliveryEarnings = totalAmount * 0.1;
//     const taxes = totalAmount * 0.05;
//     const restaurantEarnings = totalAmount - platformCommission - deliveryEarnings - taxes;

//     earnings.push({
//       _id: new ObjectId(),
//       total_earnings: totalAmount,
//       currency: "USD",
//       time_period: {
//         start_date: startDate,
//         end_date: endDate
//       },
//       breakdown: {
//         platform_commission: platformCommission,
//         restaurant_earnings: restaurantEarnings,
//         delivery_earnings: deliveryEarnings,
//         taxes: taxes
//       },
//       transactions: transactions,
//       payouts: [{
//         _id: new ObjectId(),
//         date: faker.date.between(startDate, new Date(endDate.getTime() + 15 * 24 * 60 * 60 * 1000)), // +15 jours
//         recipient: new ObjectId(),
//         recipientType: faker.helpers.arrayElement(["Driver", "Restaurant"]),
//         amount: restaurantEarnings,
//         status: faker.helpers.arrayElement(["completed", "pending"])
//       }],
//       createdAt: new Date(),
//       updatedAt: new Date()
//     });
//   }

//   return earnings;
// }

// module.exports = {
//   async up(db, client) {

//     // Génération des données mockées
//     const mockEarnings = generateMockEarnings();
    
//     // Insertion dans la base de données
//     await db.collection("earnings").insertMany(mockEarnings);

//     const earnings = [
//       {
//         _id: new ObjectId("67ebc4d021c649eb3e87b7d1"),
//         total_earnings: 1500,
//         currency: "USD",
//         time_period: {
//           start_date: new Date("2023-01-01"),
//           end_date: new Date("2023-01-31")
//         },
//         breakdown: {
//           platform_commission: 300,
//           restaurant_earnings: 1000,
//           delivery_earnings: 150,
//           taxes: 50
//         },
//         transactions: [
//           {
//             _id: new ObjectId(),
//             date: new Date("2023-01-15"),
//             restaurant: new ObjectId("67c69119d778f63b5e5997ca"),
//             amount: 500,
//             commission: 100,
//             delivery_fee: 50,
//             status: "completed"
//           },
//           {
//             _id: new ObjectId(),
//             date: new Date("2023-01-20"),
//             restaurant: new ObjectId("67c69119d778f63b5e5997cb"),
//             amount: 1000,
//             commission: 200,
//             delivery_fee: 100,
//             status: "completed"
//           }
//         ],
//         payouts: [
//           {
//             _id: new ObjectId(),
//             date: new Date("2023-02-05"),
//             recipient: new ObjectId("67e42186605ac4ba474a2795"),
//             recipientType: "Driver",
//             amount: 1000,
//             status: "completed"
//           }
//         ],
//         createdAt: new Date(),
//         updatedAt: new Date()
//       },
//       {
//         _id: new ObjectId("67ebc4d021c649eb3e87b7d2"),
//         total_earnings: 2000,
//         currency: "USD",
//         time_period: {
//           start_date: new Date("2023-02-01"),
//           end_date: new Date("2023-02-28")
//         },
//         breakdown: {
//           platform_commission: 400,
//           restaurant_earnings: 1400,
//           delivery_earnings: 150,
//           taxes: 50
//         },
//         transactions: [
//           {
//             _id: new ObjectId(),
//             date: new Date("2023-02-10"),
//             restaurant: new ObjectId("67c69119d778f63b5e5997ca"),
//             amount: 800,
//             commission: 160,
//             delivery_fee: 60,
//             status: "completed"
//           },
//           {
//             _id: new ObjectId(),
//             date: new Date("2023-02-15"),
//             restaurant: new ObjectId("67c69119d778f63b5e5997cb"),
//             amount: 1200,
//             commission: 240,
//             delivery_fee: 90,
//             status: "completed"
//           }
//         ],
//         payouts: [
//           {
//             _id: new ObjectId(),
//             date: new Date("2023-03-05"),
//             recipient: new ObjectId("67c69119d778f63b5e5997ca"),
//             recipientType: "Restaurant",
//             amount: 1400,
//             status: "pending"
//           }
//         ],
//         createdAt: new Date(),
//         updatedAt: new Date()
//       }
//     ];

//     // await db.collection("earnings").insertMany(earnings);
//   },

//   async down(db, client) {
//     // await db.collection("earnings").deleteMany({
//     //   _id: {
//     //     $in: [
//     //       new ObjectId("67ebc4d021c649eb3e87b7d1"),
//     //       new ObjectId("67ebc4d021c649eb3e87b7d2")
//     //     ]
//     //   }
//     // });
//   }
// };