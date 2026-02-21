const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');
module.exports = {
  async up(db) {
    try {
      await db.collection("timeslots").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    const existingRestaurants = await db.collection('restaurants')
      .find({})
      .project({ _id: 1, name: 1 })
      .toArray();
    if (existingRestaurants.length === 0) {
      throw new Error('Aucun restaurant trouvé dans la base de données');
    }
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const slotTypes = ['delivery', 'pickup', 'both'];
    const mockTimeSlots = existingRestaurants.flatMap(restaurant => {
      return Array.from({ length: 3 }, () => {
        const day = faker.helpers.arrayElement(daysOfWeek);
        const startHour = faker.number.int({ min: 8, max: 12 }); 
        const endHour = startHour + faker.number.int({ min: 4, max: 8 }); 
        return {
          restaurant: restaurant._id,
          restaurants: {
            value: restaurant._id.toString(),
            label: restaurant.name
          },
          day_of_week: day,
          start_time: `${startHour.toString().padStart(2, '0')}:00`,
          end_time: `${endHour.toString().padStart(2, '0')}:00`,
          max_orders: faker.number.int({ min: 10, max: 30 }),
          is_active: faker.datatype.boolean({ probability: 0.9 }), 
          slot_type: faker.helpers.arrayElement(slotTypes),
          created_at: faker.date.past({ years: 1 }),
          updated_at: faker.date.recent({ days: 30 }),
        };
      });
    });
    await db.collection('timeslots').insertMany(mockTimeSlots);
  },
  async down(db) {
    await db.collection('timeslots').deleteMany({
      created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};
