const mongoose = require("mongoose");

module.exports = {
  async up(db, client) {
    const earnings = [
      {
        _id: new mongoose.Types.ObjectId("67ebc4d021c649eb3e87b7d1"),
        total_earnings: 1500,
        currency: "USD",
        time_period: {
          start_date: new Date("2023-01-01"),
          end_date: new Date("2023-01-31")
        },
        breakdown: {
          platform_commission: 300,
          restaurant_earnings: 1000,
          delivery_earnings: 150,
          taxes: 50
        },
        transactions: [
          {
            _id: new mongoose.Types.ObjectId(),
            date: new Date("2023-01-15"),
            restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997ca"),
            amount: 500,
            commission: 100,
            delivery_fee: 50,
            status: "completed"
          },
          {
            _id: new mongoose.Types.ObjectId(),
            date: new Date("2023-01-20"),
            restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997cb"),
            amount: 1000,
            commission: 200,
            delivery_fee: 100,
            status: "completed"
          }
        ],
        payouts: [
          {
            _id: new mongoose.Types.ObjectId(),
            date: new Date("2023-02-05"),
            recipient: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d6"),
            amount: 1000,
            status: "completed"
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId("67ebc4d021c649eb3e87b7d2"),
        total_earnings: 2000,
        currency: "USD",
        time_period: {
          start_date: new Date("2023-02-01"),
          end_date: new Date("2023-02-28")
        },
        breakdown: {
          platform_commission: 400,
          restaurant_earnings: 1400,
          delivery_earnings: 150,
          taxes: 50
        },
        transactions: [
          {
            _id: new mongoose.Types.ObjectId(),
            date: new Date("2023-02-10"),
            restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997ca"),
            amount: 800,
            commission: 160,
            delivery_fee: 60,
            status: "completed"
          },
          {
            _id: new mongoose.Types.ObjectId(),
            date: new Date("2023-02-15"),
            restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997cb"),
            amount: 1200,
            commission: 240,
            delivery_fee: 90,
            status: "completed"
          }
        ],
        payouts: [
          {
            _id: new mongoose.Types.ObjectId(),
            date: new Date("2023-03-05"),
            recipient: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d6"),
            amount: 1400,
            status: "pending"
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await db.collection("earnings").insertMany(earnings);
  },

  async down(db, client) {
    await db.collection("earnings").deleteMany({
      _id: {
        $in: [
          new mongoose.Types.ObjectId("67ebc4d021c649eb3e87b7d1"),
          new mongoose.Types.ObjectId("67ebc4d021c649eb3e87b7d2")
        ]
      }
    });
  }
};