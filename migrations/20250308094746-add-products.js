
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

const PREMIUM_FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format',  
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format',  
  'https://images.unsplash.com/photo-1565958011703-72f8580dce83?w=800&auto=format',  
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&auto=format',  
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&auto=format',  
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format'   
];

function getPremiumFoodImage() {
  return PREMIUM_FOOD_IMAGES[Math.floor(Math.random() * PREMIUM_FOOD_IMAGES.length)];
}

module.exports = {
  async up(db) {
    try {
      await db.collection("products").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    
    const existingCategories = await db.collection('categories')
      .find({})
      .project({ _id: 1, name: 1 })
      .toArray();

    if (existingCategories.length === 0) {
      
      return
    }
    
    const existingRestaurants = await db.collection('restaurants')
      .find({})
      .project({ _id: 1, name: 1 })
      .toArray();

    if (existingRestaurants.length === 0) {
      
      return
    }
    
    const existingVariants = await db.collection('variants')
      .find({})
      .project({ _id: 1, name: 1 })
      .toArray();
    
    const mockProducts = Array.from({ length: 150 }, (_, i) => {
      const category = faker.helpers.arrayElement(existingCategories);
      const restaurant = faker.helpers.arrayElement(existingRestaurants);
      const selectedVariants = existingVariants.length > 0 
        ? faker.helpers.arrayElements(existingVariants, faker.number.int({ min: 0, max: 3 }))
            .map(variant => ({ value: variant._id, label: variant.name }))
        : [];

      const hasDiscount = faker.datatype.boolean({ probability: 0.25 });
      const ratingAverage = faker.number.float({ min: 1, max: 5, precision: 0.1 });
      
      return {
        
        name: faker.food.dish(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price({ min: 2, max: 30 })),
        currency: 'EUR',
        image: getPremiumFoodImage(),
        category: category._id,
        categories: {
          value: category._id.toString(),
          label: category.name
        },
        restaurant: restaurant._id,
        restaurants: {
          value: restaurant._id.toString(),
          label: restaurant.name
        },
        availability: faker.datatype.boolean({ probability: 0.85 }),
        preparation_time: faker.number.int({ min: 5, max: 45 }),
        tags: faker.helpers.arrayElements(
          ['bio', 'végétarien', 'épicé', 'sans gluten', 'vegan', 'fait maison'],
          faker.number.int({ min: 0, max: 3 })
        ),
        ingredients: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => 
          faker.commerce.productMaterial()
        ),
        discount: {
          isActive: hasDiscount,
          percentage: hasDiscount ? faker.number.int({ min: 5, max: 25 }) : 0,
          startDate: hasDiscount ? faker.date.recent() : null,
          endDate: hasDiscount ? faker.date.soon({ days: 30 }) : null
        },
        rating: {
          average: ratingAverage,
          count: faker.number.int({ min: 0, max: 100 })
        },
        variants: selectedVariants,
        created_at: faker.date.past({ years: 1 }),
        updated_at: faker.date.recent({ days: 30 }),
      };
    });

    await db.collection('products').insertMany(mockProducts);
  },

  async down(db) {
    await db.collection('products').deleteMany({
      created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};

