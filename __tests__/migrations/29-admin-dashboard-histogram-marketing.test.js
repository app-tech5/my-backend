const { MongoClient, ObjectId } = require("mongodb");
const { MongoMemoryServer } = require("mongodb-memory-server");
const migration = require("../../migrations/29-admin-dashboard-histogram-marketing");

describe("migration 29-admin-dashboard-histogram-marketing", () => {
  let mongoServer;
  let client;
  let db;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    client = new MongoClient(mongoServer.getUri());
    await client.connect();
    db = client.db("test-migration-29");
  }, 60000);

  afterAll(async () => {
    await client?.close();
    await mongoServer?.stop();
  }, 60000);

  beforeEach(async () => {
    await db.dropDatabase();
  });

  const seedOrder = (overrides = {}) => ({
    _id: new ObjectId(),
    user: new ObjectId(),
    restaurant: new ObjectId(),
    status: "delivered",
    subtotal: 20,
    totalPrice: 22.5,
    tax: { rate: 0.1, amount: 2 },
    delivery: { type: "delivery", deliveryFee: 0.5 },
    items: [{ name: "Burger", quantity: 1, price: 20, total: 20 }],
    createdAt: new Date("2025-11-01T10:00:00.000Z"),
    updatedAt: new Date("2025-11-01T10:00:00.000Z"),
    ...overrides
  });

  it("splitMonthTargets separates gross and net across statuses", () => {
    const slots = migration.splitMonthTargets({ gross: 1000, net: 400 });
    const delivered = slots.filter((slot) => slot.status === "delivered");
    const cancelled = slots.filter((slot) => slot.status === "cancelled");

    expect(delivered).toHaveLength(4);
    expect(cancelled).toHaveLength(2);
    expect(delivered.reduce((sum, slot) => sum + slot.targetTotal, 0)).toBeCloseTo(400, 1);
    expect(cancelled.reduce((sum, slot) => sum + slot.targetTotal, 0)).toBeCloseTo(600, 1);
  });

  it("up spreads orders across Jan–Jul with migration seed key", async () => {
    const restaurantId = new ObjectId();
    const userId = new ObjectId();
    const orders = Array.from({ length: 50 }, (_, index) =>
    seedOrder({
      _id: new ObjectId(),
      user: userId,
      restaurant: restaurantId,
      totalPrice: 18 + index
    })
    );

    await db.collection("restaurants").insertOne({
      _id: restaurantId,
      name: "Test Kitchen",
      latitude: 48.8566,
      longitude: 2.3522
    });
    await db.collection("users").insertOne({
      _id: userId,
      location: { latitude: 48.86, longitude: 2.35 }
    });
    await db.collection("orders").insertMany(orders);

    await migration.up(db);

    const touched = await db.
    collection("orders").
    find({ migrationSeedKey: migration.SEED_KEY }).
    toArray();

    expect(touched.length).toBe(migration.MONTH_TARGETS.length * 6);

    const months = new Set(
      touched.map((order) => order.createdAt.getMonth())
    );
    expect(months.size).toBe(7);
    expect(Math.min(...months)).toBe(0);
    expect(Math.max(...months)).toBe(6);
  });

  it("down restores previous order snapshot", async () => {
    const order = seedOrder();
    await db.collection("orders").insertOne(order);

    await migration.up(db);

    const migrated = await db.collection("orders").findOne({ _id: order._id });
    expect(migrated.migrationSeedKey).toBe(migration.SEED_KEY);

    await migration.down(db);

    const restored = await db.collection("orders").findOne({ _id: order._id });
    expect(restored.migrationSeedKey).toBeUndefined();
    expect(restored.status).toBe("delivered");
    expect(restored.totalPrice).toBe(22.5);
    expect(restored.createdAt.toISOString()).toBe("2025-11-01T10:00:00.000Z");
  });
});
