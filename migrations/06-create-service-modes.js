module.exports = {
  async up(db, client) {
    try {
      await db.collection("servicemodes").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }

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
