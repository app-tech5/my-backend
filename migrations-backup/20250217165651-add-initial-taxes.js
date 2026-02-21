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
      { location: "Spain", name: "VAT (IVA)", baseRate: 21 },
      { location: "Italy", name: "VAT (IVA)", baseRate: 22 },
      { location: "Belgium", name: "VAT", baseRate: 21 },
      { location: "Luxembourg", name: "VAT", baseRate: 17 },
      { location: "United States", name: "Sales Tax", baseRate: 7.25 },
      { location: "Canada", name: "GST", baseRate: 5 },
      { location: "Switzerland", name: "VAT", baseRate: 7.7 },
      { location: "United Kingdom", name: "VAT", baseRate: 20 }
];
    const mockTaxes = taxLocations.map(loc => ({
      location: loc.location,
      name: loc.name,
      rate: faker.number.float({
        min: loc.baseRate - 2,
        max: loc.baseRate + 3,
        precision: 0.01
      }),
      created_at: faker.date.past({ years: 1 }),
      updated_at: faker.date.recent({ days: 30 })
    }));
    const existingTaxes = await db.collection('taxes')
      .find({ location: { $in: taxLocations.map(t => t.location) } })
      .count();
    if (existingTaxes > 0) {
      throw new Error('Des taxes existent déjà pour certaines de ces localisations');
    }
    await db.collection('taxes').insertMany(mockTaxes);
  },
  async down(db) {
    await db.collection('taxes').deleteMany({
      created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};
