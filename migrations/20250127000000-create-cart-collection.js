const mongoose = require('mongoose');

module.exports = {
  async up(db) {
    // Créer la collection carts avec validation
    await db.createCollection('carts', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['user'],
          properties: {
            user: {
              bsonType: 'objectId',
              description: 'must be an objectId and is required'
            },
            items: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                required: ['item', 'itemType', 'name', 'image', 'price', 'quantity', 'totalPrice', 'uniqueKey', 'restaurant', 'restaurantName'],
                properties: {
                  item: {
                    bsonType: 'objectId',
                    description: 'must be an objectId'
                  },
                  itemType: {
                    enum: ['Menu', 'Product'],
                    description: 'must be either Menu or Product'
                  },
                  name: {
                    bsonType: 'string',
                    description: 'must be a string'
                  },
                  image: {
                    bsonType: 'string',
                    description: 'must be a string'
                  },
                  price: {
                    bsonType: 'number',
                    description: 'must be a number'
                  },
                  quantity: {
                    bsonType: 'int',
                    minimum: 1,
                    description: 'must be an integer >= 1'
                  },
                  totalPrice: {
                    bsonType: 'number',
                    description: 'must be a number'
                  },
                  uniqueKey: {
                    bsonType: 'string',
                    description: 'must be a string'
                  },
                  restaurant: {
                    bsonType: 'objectId',
                    description: 'must be an objectId'
                  },
                  restaurantName: {
                    bsonType: 'string',
                    description: 'must be a string'
                  }
                }
              }
            },
            deviceId: {
              bsonType: 'string',
              description: 'must be a string'
            },
            sessionId: {
              bsonType: 'string',
              description: 'must be a string'
            },
            expiresAt: {
              bsonType: 'date',
              description: 'must be a date'
            }
          }
        }
      }
    });

    // Créer les index
    await db.collection('carts').createIndex({ user: 1 }, { unique: true });
    await db.collection('carts').createIndex({ deviceId: 1 });
    await db.collection('carts').createIndex({ sessionId: 1 });
    await db.collection('carts').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    console.log('✅ Cart collection created successfully');
  },

  async down(db) {
    // Supprimer la collection
    await db.collection('carts').drop();
    console.log('✅ Cart collection dropped');
  }
};
