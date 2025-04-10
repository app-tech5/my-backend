// migrations/XXXXXX-generate-mock-transactions.js

const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

module.exports = {
  async up(db) {
    try {
      await db.collection("transactions").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    // Récupérer les utilisateurs existants
    const existingUsers = await db.collection('users')
      .find({})
      .project({ _id: 1 })
      .toArray();

    if (existingUsers.length === 0) {
      throw new Error('Aucun utilisateur trouvé dans la base de données');
    }

    // Récupérer les commandes existantes
    const existingOrders = await db.collection('orders')
      .find({})
      .project({ _id: 1, total_amount: 1 })
      .toArray();

    // Types de transactions avec leurs propriétés spécifiques
    const transactionTypes = [
      { type: 'customer_payment', paymentMethod: true, payoutMethod: false },
      { type: 'restaurant_payout', paymentMethod: false, payoutMethod: true },
      { type: 'driver_payout', paymentMethod: false, payoutMethod: true },
      { type: 'platform_commission', paymentMethod: false, payoutMethod: false },
      { type: 'service_fee', paymentMethod: false, payoutMethod: false },
      { type: 'delivery_fee', paymentMethod: false, payoutMethod: false },
      { type: 'tip', paymentMethod: true, payoutMethod: false },
      { type: 'refund', paymentMethod: false, payoutMethod: false },
      { type: 'adjustment', paymentMethod: false, payoutMethod: false }
    ];

    const paymentMethods = [
      'credit_card', 'debit_card', 'paypal', 'apple_pay', 
      'google_pay', 'venmo', 'ach_transfer', 'platform_credit', 'cash'
    ];

    const payoutMethods = [
      'ach_deposit', 'instant_pay', 'check', 'paypal', 'platform_balance'
    ];

    const statuses = ['pending', 'completed', 'failed', 'canceled', 'disputed', 'refunded'];

    // Générer des transactions fictives
    const mockTransactions = Array.from({ length: 100 }, (_, i) => {
      const transactionType = faker.helpers.arrayElement(transactionTypes);
      const status = faker.helpers.arrayElement(statuses);
      const isCompleted = status === 'completed';
      const dateCreated = faker.date.past({ years: 1 });
      const amount = faker.number.float({ min: 1, max: 200, precision: 0.01 });
      const order = existingOrders.length > 0 ? faker.helpers.arrayElement(existingOrders) : null;

      // Calculer les frais basés sur le montant
      const platformFeeAmount = parseFloat((amount * 0.1).toFixed(2)); // 10%
      const processorFeeAmount = parseFloat((amount * 0.02).toFixed(2)); // 2%
      const taxAmount = parseFloat((amount * 0.08).toFixed(2)); // 8%

      // FORCER payment_method à avoir une valeur quand requis
      const paymentMethodValue = transactionType.paymentMethod 
        ? faker.helpers.arrayElement(paymentMethods)
        : "not_applicable"; // Valeur par défaut au lieu de null/undefined

      return {
        transaction_type: transactionType.type,
        amount: amount,
        currency: 'USD',
        status: status,
        payment_method: paymentMethodValue, // TOUJOURS défini
        payout_method: transactionType.payoutMethod ? faker.helpers.arrayElement(payoutMethods) : "not_applicable", // TOUJOURS défini
        date_created: dateCreated,
        date_processed: isCompleted ? faker.date.between({ from: dateCreated, to: new Date() }) : undefined,
        date_completed: isCompleted ? faker.date.between({ from: dateCreated, to: new Date() }) : undefined,
        related_order: order?._id,
        user: faker.helpers.arrayElement(existingUsers)._id,
        platform_fee: {
          amount: platformFeeAmount,
          percentage: 10,
          description: 'Platform commission'
        },
        processor_fee: {
          amount: processorFeeAmount,
          description: 'Payment processing fee'
        },
        tax: {
          amount: taxAmount,
          description: 'Sales tax'
        },
        createdAt: dateCreated,
        updatedAt: new Date()
      };
    });

    // Insérer les transactions dans la base de données
    await db.collection('transactions').insertMany(mockTransactions);
  },

  async down(db) {
    // Supprimer uniquement les transactions générées (identifier par createdAt récent)
    await db.collection('transactions').deleteMany({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};


// const mongoose = require("mongoose");

// module.exports = {
//   async up(db, client) {
//     const transactions = [
//       {
//         _id: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7d1"),
//         transaction_type: "customer_payment",
//         amount: 25.99,
//         currency: "USD",
//         status: "completed",
//         payment_method: "credit_card",
//         user: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d6"),
//         related_order: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7c2"),
//         platform_fee: {
//           amount: 3.90,
//           percentage: 15,
//           description: "Platform commission"
//         },
//         processor_fee: {
//           amount: 0.78,
//           description: "Stripe processing fee"
//         },
//         tax: {
//           amount: 2.08,
//           description: "Sales tax"
//         },
//         date_created: new Date("2023-01-15T10:30:00Z"),
//         date_completed: new Date("2023-01-15T10:32:00Z"),
//         // metadata: {
//         //   processor_id: "pi_123456789",
//         //   invoice_id: "inv_20230115_001"
//         // }
//       },
//       {
//         _id: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7d2"),
//         transaction_type: "restaurant_payout",
//         amount: 18.23,
//         currency: "USD",
//         status: "pending",
//         payout_method: "ach_deposit",
//         user: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d6"),
//         related_order: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7c2"),
//         date_created: new Date("2023-01-15T10:35:00Z"),
//         // metadata: {
//         //   notes: "Payout scheduled for next business day"
//         // }
//       },
//       {
//         _id: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7d3"),
//         transaction_type: "driver_payout",
//         amount: 4.50,
//         currency: "USD",
//         status: "completed",
//         payout_method: "instant_pay",
//         user: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d7"),
//         related_order: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7c2"),
//         date_created: new Date("2023-01-15T11:15:00Z"),
//         date_completed: new Date("2023-01-15T11:16:00Z"),
//         // metadata: {
//         //   processor_id: "py_987654321"
//         // }
//       },
//       {
//         _id: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7d4"),
//         transaction_type: "platform_commission",
//         amount: 3.90,
//         currency: "USD",
//         status: "completed",
//         user: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d7"),
//         related_order: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7c2"),
//         date_created: new Date("2023-01-15T10:32:00Z")
//       },
//       {
//         _id: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7d5"),
//         transaction_type: "tip",
//         amount: 5.00,
//         currency: "USD",
//         status: "completed",
//         payment_method: "credit_card",
//         user: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d8"),
//         related_order: new mongoose.Types.ObjectId("67cbc4d021c649eb3e87b7c2"),
//         date_created: new Date("2023-01-15T10:33:00Z"),
//         date_completed: new Date("2023-01-15T10:33:00Z"),
//         // metadata: {
//         //   processor_id: "pi_123456789_tip"
//         // }
//       }
//     ];

//     // Insertion des transactions
//     await db.collection("transactions").insertMany(transactions);
//   },

//   async down(db, client) {
//     await db.collection("transactions").drop();
//   }
// };