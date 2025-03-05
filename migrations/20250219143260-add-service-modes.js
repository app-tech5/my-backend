// 20230101123456-add-service-modes.js

module.exports = {
  async up(db, client) {
    // Insérez les documents dans la collection serviceModes
    const serviceModes = [
      { value: 'pickup', label: 'Pickup' },
      { value: 'delivery', label: 'Delivery' }
    ];

    await db.collection('servicemodes').insertMany(serviceModes);
  },

  async down(db, client) {
    // Supprimez les documents de la collection serviceModes
    await db.collection('servicemodes').deleteMany({
      value: { $in: ['pickup', 'delivery'] }
    });
  }
};
