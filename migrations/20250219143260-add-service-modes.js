module.exports = {
  async up(db, client) {
    const serviceModes = [
      { value: 'pickup', label: 'Pickup' },
      { value: 'delivery', label: 'Delivery' }
    ];
    await db.collection('servicemodes').insertMany(serviceModes);
  },
  async down(db, client) {
    await db.collection('servicemodes').deleteMany({
      value: { $in: ['pickup', 'delivery'] }
    });
  }
};
