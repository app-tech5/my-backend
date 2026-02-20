
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

module.exports = {
  async up(db) {
    try {
      await db.collection("restaurantreports").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    
    const [restaurants, users, orders] = await Promise.all([
      db.collection('restaurants').find({}).project({ _id: 1 }).toArray(),
      db.collection('users').find({}).project({ _id: 1 }).toArray(),
      db.collection('orders').find({}).project({ _id: 1 }).toArray()
    ]);

    if (restaurants.length === 0) {
      throw new Error('Aucun restaurant trouvé dans la base de données');
    }

    const reportTypes = [
      'hygiene', 'food_quality', 'service_quality', 'fake_menu',
      'price_issue', 'delivery_issue', 'false_advertising', 'other'
    ];
    const statuses = ['pending', 'under_review', 'resolved', 'rejected'];
    const severities = ['low', 'medium', 'high', 'critical'];
    
    const mockReports = Array.from({ length: 50 }, (_, i) => {
      const reportType = faker.helpers.arrayElement(reportTypes);
      const isAnonymous = faker.datatype.boolean({ probability: 0.3 });
      const hasOrderRef = faker.datatype.boolean({ probability: 0.7 });
      const hasEvidence = faker.datatype.boolean({ probability: 0.6 });
      const isResolved = faker.datatype.boolean({ probability: 0.4 });
      const status = isResolved 
        ? faker.helpers.arrayElement(['resolved', 'rejected']) 
        : faker.helpers.arrayElement(['pending', 'under_review']);

      return {
        restaurant: faker.helpers.arrayElement(restaurants)._id,
        reportedBy: isAnonymous ? null : faker.helpers.arrayElement(users)._id,
        isAnonymous,
        reportType,
        otherDetails: reportType === 'other' ? faker.lorem.sentence() : undefined,
        description: faker.lorem.paragraph(),
        orderReference: hasOrderRef && orders.length > 0 
          ? faker.helpers.arrayElement(orders)._id 
          : null,
        evidencePhotos: hasEvidence 
          ? Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.image.urlLoremFlickr({ category: 'food' }))
          : [],
        status,
        adminNotes: status !== 'pending'
          ? [{
              note: faker.lorem.sentence(),
              addedBy: users.length > 0 ? faker.helpers.arrayElement(users)._id : null,
              addedAt: faker.date.recent()
            }]
          : [],
        resolvedBy: status === 'resolved' && users.length > 0 
          ? faker.helpers.arrayElement(users)._id 
          : null,
        resolvedAt: status === 'resolved' ? faker.date.recent() : null,
        resolutionDetails: status === 'resolved' ? faker.lorem.paragraph() : null,
        severity: faker.helpers.arrayElement(severities),
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent()
      };
    });

    await db.collection('restaurantreports').insertMany(mockReports);
  },

  async down(db) {
    
    await db.collection('restaurantreports').deleteMany({
      createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) }
    });
  }
};