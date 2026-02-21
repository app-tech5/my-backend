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
    const restaurants = await db.collection("restaurants").find({}).project({ _id: 1 }).toArray();
    const drivers = await db.collection("drivers").find({}).project({ _id: 1 }).toArray();
    if (restaurants.length === 0 || drivers.length === 0) {
      throw new Error("Les collections restaurants ou drivers sont vides");
    }
    const generateMockEarnings = () => {
      const monthsToGenerate = 15;
      const earnings = [];
      const currentDate = new Date();
      for (let i = 0; i < monthsToGenerate; i++) {
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
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
        const platformCommission = totalAmount * 0.2;
        const deliveryEarnings = totalAmount * 0.1;
        const taxes = totalAmount * 0.05;
        const restaurantEarnings = totalAmount - platformCommission - deliveryEarnings - taxes;
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
            amount: recipientType === "Restaurant" ? restaurantEarnings : deliveryEarnings,
            status: faker.helpers.arrayElement(["completed", "pending"])
          }],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      return earnings;
    };
    const mockEarnings = generateMockEarnings();
    await db.collection("earnings").insertMany(mockEarnings);
  },
  async down(db, client) {
    await db.collection("earnings").deleteMany({});
  }
};
