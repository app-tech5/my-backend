const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
module.exports = {
  async up(db) {
    try {
      await db.collection("mongoose").drop();
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
    const notificationTypes = [
      'order_status', 
      'promotion', 
      'system', 
      'delivery_update',
      'new_restaurant',
      'payment',
      'account'
    ];
    const entityModels = ['Order', 'Payment', 'Delivery'];
    const mockNotifications = Array.from({ length: 100 }, (_, i) => {
      const user = faker.helpers.arrayElement(existingUsers);
      const type = faker.helpers.arrayElement(notificationTypes);
      const requiresEntity = ['order_status', 'delivery_update', 'payment'].includes(type);
      const isActionRequired = faker.datatype.boolean({ probability: 0.2 });
      const notification = {
        user: user._id,
        title: faker.lorem.words(faker.number.int({ min: 3, max: 7 })),
        message: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })),
        imageUrl: faker.datatype.boolean({ probability: 0.5 }) 
          ? faker.image.urlLoremFlickr({ category: 'food' }) + '.png'
          : undefined,
        type,
        isRead: faker.datatype.boolean({ probability: 0.3 }),
        isActionRequired,
        priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
        createdBy: faker.helpers.arrayElement(['system', 'restaurant', 'admin', 'delivery']),
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent({ days: 30 })
      };
      if (requiresEntity) {
        notification.relatedEntity = new ObjectId();
        notification.relatedEntityModel = faker.helpers.arrayElement(entityModels);
      }
      if (isActionRequired) {
        notification.actionUrl = faker.internet.url();
      }
      if (faker.datatype.boolean({ probability: 0.4 })) {
        notification.expiresAt = faker.date.future({ years: 1 });
      }
      return notification;
    });
    await db.collection('notifications').insertMany(mockNotifications);
  },
  async down(db) {
    await db.collection('notifications').deleteMany({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};