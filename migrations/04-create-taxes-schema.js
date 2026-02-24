const { faker } = require('@faker-js/faker');

module.exports = {
  async up(db) {
    try {
      await db.collection("taxes").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    
    const taxLocations = [
      { location: "France", name: "VAT", baseRate: 20 },
      { location: "Germany", name: "VAT (MwSt)", baseRate: 19 },
      { location: "United States", name: "Sales Tax", baseRate: 7.25 }
    ];

    const mockTaxes = taxLocations.map(loc => ({
      location: loc.location,
      name: loc.name,
      rate: loc.baseRate, 
      created_at: new Date(),
      updated_at: new Date()
    }));

    await db.collection('taxes').insertMany(mockTaxes);
  },
  async down(db) {
    await db.collection('taxes').deleteMany({
      created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};
