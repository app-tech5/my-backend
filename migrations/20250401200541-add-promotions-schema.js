// migrations/XXXXXX-generate-mock-promotions.js

const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

// Petit tableau d'images de nourriture réelles
const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38',
  // 'https://images.unsplash.com/photo-1565958011703-44f9829ba187',
  // 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543',
  // 'https://images.unsplash.com/photo-1484723091739-30a097e8f929',
  // 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
  // 'https://images.unsplash.com/photo-1544025162-d76694265947',
  // 'https://images.unsplash.com/photo-1559847844-5315695dadae'
];

module.exports = {
  async up(db) {
    try {
      await db.collection("promotions").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    // Récupérer les données existantes nécessaires
    const [restaurants, menuItems, users] = await Promise.all([
      db.collection('restaurants').find({}).project({ _id: 1 }).toArray(),
      db.collection('menus').find({}).project({ _id: 1, price: 1 }).toArray(),
      db.collection('users').find({}).project({ _id: 1 }).toArray()
    ]);

    if (!restaurants.length || !menuItems.length || !users.length) {
      throw new Error('Données requises manquantes (restaurants, menus ou users)');
    }

    // Types de promotions possibles
    const promotionTypes = [
      'percentage_discount', 
      'fixed_discount', 
      'free_delivery', 
      'buy_x_get_y', 
      'combo_deal',
      'flash_sale',
      'happy_hour'
    ];

    // Catégories possibles
    const categories = ['pizza', 'burger', 'sushi', 'dessert', 'boisson', 'asiatique', 'italien'];

    // Générer 20 promotions fictives
    const mockPromotions = Array.from({ length: 20 }, (_, i) => {
      const promotionType = faker.helpers.arrayElement(promotionTypes);
      const scope = faker.helpers.arrayElement(['restaurant', 'category', 'platform', 'item']);
      const startDate = faker.date.soon({ days: 1 });
      const endDate = faker.date.soon({ days: 30, refDate: startDate });

      // Configuration spécifique au type de promotion
      const promotionConfig = {};
      if (['percentage_discount', 'fixed_discount'].includes(promotionType)) {
        promotionConfig.discountValue = promotionType === 'percentage_discount' 
          ? faker.number.int({ min: 5, max: 50 }) 
          : faker.number.float({ min: 2, max: 15, precision: 0.5 });
      }

      if (promotionType === 'buy_x_get_y') {
        promotionConfig.buyQuantity = faker.number.int({ min: 1, max: 3 });
        promotionConfig.getQuantity = faker.number.int({ min: 1, max: 2 });
      }

      if (promotionType === 'combo_deal') {
        const comboItems = faker.helpers.arrayElements(menuItems, { min: 2, max: 4 })
          .map(item => ({
            item: item._id,
            discountedPrice: item.price * faker.number.float({ min: 0.7, max: 0.9, precision: 0.05 })
          }));
        promotionConfig.comboItems = comboItems;
      }

      if (promotionType === 'happy_hour') {
        promotionConfig.happyHours = [{
          start: `${faker.number.int({ min: 16, max: 18 })}:00`,
          end: `${faker.number.int({ min: 20, max: 22 })}:00`,
          days: faker.helpers.arrayElements([0,1,2,3,4,5,6], { min: 2, max: 5 })
        }];
      }

      // Configuration de la portée
      const scopeConfig = {};
      if (scope === 'restaurant') {
        scopeConfig.applicableRestaurants = faker.helpers.arrayElements(restaurants, { min: 1, max: 3 })
          .map(r => r._id);
      } else if (scope === 'category') {
        scopeConfig.applicableCategories = faker.helpers.arrayElements(categories, { min: 1, max: 3 });
      } else if (scope === 'item') {
        scopeConfig.applicableItems = faker.helpers.arrayElements(menuItems, { min: 1, max: 5 })
          .map(i => i._id);
      }

      return {
        name: `${faker.commerce.productAdjective()} Promotion`,
        description: faker.commerce.productDescription(),
        image: FOOD_IMAGES[i % FOOD_IMAGES.length],
        promotionType,
        ...promotionConfig,
        scope,
        ...scopeConfig,
        startDate,
        endDate,
        minOrderAmount: faker.datatype.boolean({ probability: 0.5 }) 
          ? faker.number.float({ min: 15, max: 50, precision: 0.5 }) 
          : undefined,
        maxDiscountAmount: promotionType === 'percentage_discount' 
          ? faker.number.float({ min: 5, max: 20, precision: 0.5 }) 
          : undefined,
        userEligibility: faker.helpers.arrayElement(['all', 'new_users', 'existing_users', 'vip']),
        maxUsage: faker.datatype.boolean({ probability: 0.7 }) 
          ? faker.number.int({ min: 50, max: 500 }) 
          : undefined,
        currentUsage: 0,
        createdBy: faker.helpers.arrayElement(users)._id,
        isActive: faker.datatype.boolean({ probability: 0.8 }),
        priority: faker.number.int({ min: 1, max: 10 }),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    await db.collection('promotions').insertMany(mockPromotions);
  },

  async down(db) {
    // Supprimer uniquement les promotions générées par cette migration
    await db.collection('promotions').deleteMany({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};