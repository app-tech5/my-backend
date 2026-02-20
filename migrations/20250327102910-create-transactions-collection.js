
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

module.exports = {
  async up(db) {
    try {
      await db.collection("transactions").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    
    const existingUsers = await db.collection('users')
      .find({})
      .project({ _id: 1 })
      .toArray();

    if (existingUsers.length === 0) {
      throw new Error('Aucun utilisateur trouvé dans la base de données');
    }
    
    const existingOrders = await db.collection('orders')
      .find({})
      .project({ _id: 1, total_amount: 1 })
      .toArray();
    
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
    
    const mockTransactions = Array.from({ length: 100 }, (_, i) => {
      const transactionType = faker.helpers.arrayElement(transactionTypes);
      const status = faker.helpers.arrayElement(statuses);
      const isCompleted = status === 'completed';
      const dateCreated = faker.date.past({ years: 1 });
      const amount = faker.number.float({ min: 1, max: 200, precision: 0.01 });
      const order = existingOrders.length > 0 ? faker.helpers.arrayElement(existingOrders) : null;
      
      const platformFeeAmount = parseFloat((amount * 0.1).toFixed(2)); 
      const processorFeeAmount = parseFloat((amount * 0.02).toFixed(2)); 
      const taxAmount = parseFloat((amount * 0.08).toFixed(2)); 
      
      const paymentMethodValue = transactionType.paymentMethod 
        ? faker.helpers.arrayElement(paymentMethods)
        : "not_applicable"; 

      return {
        transaction_type: transactionType.type,
        amount: amount,
        currency: 'USD',
        status: status,
        payment_method: paymentMethodValue, 
        payout_method: transactionType.payoutMethod ? faker.helpers.arrayElement(payoutMethods) : "not_applicable", 
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
    
    await db.collection('transactions').insertMany(mockTransactions);
  },

  async down(db) {
    
    await db.collection('transactions').deleteMany({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};

