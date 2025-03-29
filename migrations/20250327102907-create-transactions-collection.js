const mongoose = require("mongoose");

module.exports = {
  async up(db, client) {
    const transactions = [
      {
        _id: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7d1"),
        transaction_type: "customer_payment",
        amount: 25.99,
        currency: "USD",
        status: "completed",
        payment_method: "credit_card",
        user: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d6"),
        related_order: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7c2"),
        platform_fee: {
          amount: 3.90,
          percentage: 15,
          description: "Platform commission"
        },
        processor_fee: {
          amount: 0.78,
          description: "Stripe processing fee"
        },
        tax: {
          amount: 2.08,
          description: "Sales tax"
        },
        date_created: new Date("2023-01-15T10:30:00Z"),
        date_completed: new Date("2023-01-15T10:32:00Z"),
        // metadata: {
        //   processor_id: "pi_123456789",
        //   invoice_id: "inv_20230115_001"
        // }
      },
      {
        _id: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7d2"),
        transaction_type: "restaurant_payout",
        amount: 18.23,
        currency: "USD",
        status: "pending",
        payout_method: "ach_deposit",
        user: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d6"),
        related_order: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7c2"),
        date_created: new Date("2023-01-15T10:35:00Z"),
        // metadata: {
        //   notes: "Payout scheduled for next business day"
        // }
      },
      {
        _id: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7d3"),
        transaction_type: "driver_payout",
        amount: 4.50,
        currency: "USD",
        status: "completed",
        payout_method: "instant_pay",
        user: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d7"),
        related_order: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7c2"),
        date_created: new Date("2023-01-15T11:15:00Z"),
        date_completed: new Date("2023-01-15T11:16:00Z"),
        // metadata: {
        //   processor_id: "py_987654321"
        // }
      },
      {
        _id: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7d4"),
        transaction_type: "platform_commission",
        amount: 3.90,
        currency: "USD",
        status: "completed",
        user: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d7"),
        related_order: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7c2"),
        date_created: new Date("2023-01-15T10:32:00Z")
      },
      {
        _id: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7d5"),
        transaction_type: "tip",
        amount: 5.00,
        currency: "USD",
        status: "completed",
        payment_method: "credit_card",
        user: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d8"),
        related_order: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7c2"),
        date_created: new Date("2023-01-15T10:33:00Z"),
        date_completed: new Date("2023-01-15T10:33:00Z"),
        // metadata: {
        //   processor_id: "pi_123456789_tip"
        // }
      }
    ];

    // Insertion des transactions
    await db.collection("transactions").insertMany(transactions);
  },

  async down(db, client) {
    await db.collection("transactions").drop();
  }
};