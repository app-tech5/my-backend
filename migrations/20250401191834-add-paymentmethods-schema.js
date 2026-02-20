
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

module.exports = {
  async up(db) {
    try {
      await db.collection("paymentmethods").drop();
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
    
    const methodTypes = [
      'credit_card', 
      'debit_card', 
      'paypal', 
      'apple_pay', 
      'google_pay', 
      'bank_transfer', 
      'cash_on_delivery'
    ];
    
    const mockPaymentMethods = existingUsers.flatMap(user => {
      const methodsForUser = [];
      const methodsCount = faker.number.int({ min: 1, max: 3 });
      
      let hasDefault = false;

      for (let i = 0; i < methodsCount; i++) {
        const methodType = faker.helpers.arrayElement(methodTypes);
        const isDefault = !hasDefault && faker.datatype.boolean({ probability: 0.7 });
        if (isDefault) hasDefault = true;

        const baseMethod = {
          user: user._id,
          methodType,
          isDefault,
          isActive: faker.datatype.boolean({ probability: 0.9 }),
          createdAt: faker.date.past({ years: 1 }),
          updatedAt: faker.date.recent({ days: 30 }),
          verificationStatus: faker.helpers.arrayElement(['unverified', 'pending', 'verified', 'failed']),
          verificationDate: faker.datatype.boolean({ probability: 0.5 }) 
            ? faker.date.recent({ days: 30 }) 
            : null
        };
        
        switch (methodType) {
          case 'credit_card':
          case 'debit_card':
            const cardBrand = faker.helpers.arrayElement([
              'visa', 'mastercard', 'amex', 'discover', 
              'jcb', 'diners', 'unionpay', 'other'
            ]);
            
            baseMethod.cardDetails = {
              cardNumberLast4: faker.string.numeric(4),
              cardBrand,
              expiryMonth: faker.number.int({ min: 1, max: 12 }),
              expiryYear: faker.number.int({ min: new Date().getFullYear(), max: new Date().getFullYear() + 5 }),
              cardholderName: faker.person.fullName(),
              billingAddress: {
                line1: faker.location.streetAddress(),
                line2: faker.datatype.boolean({ probability: 0.3 }) ? faker.location.secondaryAddress() : undefined,
                city: faker.location.city(),
                state: faker.location.state(),
                postalCode: faker.location.zipCode(),
                country: faker.location.country()
              }
            };
            break;

          case 'paypal':
            baseMethod.paypalEmail = faker.internet.email({
              firstName: faker.person.firstName(),
              lastName: faker.person.lastName()
            });
            break;

          case 'apple_pay':
          case 'google_pay':
            baseMethod.walletToken = `tok_${faker.string.alphanumeric(24)}`;
            break;

          case 'cash_on_delivery':
          case 'bank_transfer':
            
            break;
        }

        methodsForUser.push(baseMethod);
      }

      return methodsForUser;
    });
    
    await db.collection('paymentmethods').insertMany(mockPaymentMethods);
  },

  async down(db) {
    
    await db.collection('paymentmethods').deleteMany({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};