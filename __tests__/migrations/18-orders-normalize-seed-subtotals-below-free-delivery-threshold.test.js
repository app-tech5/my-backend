const migration = require("../../migrations/18-orders-normalize-seed-subtotals-below-free-delivery-threshold");

describe("migration 18-orders-normalize-seed-subtotals-below-free-delivery-threshold", () => {
  it("targets subtotal just below threshold with a realistic cap", () => {
    expect(migration.getTargetSubtotal(176, 35)).toBe(22);
    expect(migration.getTargetSubtotal(176, 18)).toBe(16);
    expect(migration.getTargetSubtotal(12, 25)).toBe(12);
  });

  it("scales line items down to the requested subtotal", () => {
    const items = migration.scaleItemsToSubtotal(
      [
      { price: 50, quantity: 2, total: 100, extras: [] },
      { price: 30, quantity: 1, total: 30, extras: [] }],

      22
    );

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    expect(subtotal).toBe(22);
  });

  it("only flags seed delivery orders above the free-delivery threshold", () => {
    expect(
      migration.shouldNormalizeSeedOrder(
        { delivery: { type: "delivery" }, subtotal: 80 },
        35
      )
    ).toBe(true);

    expect(
      migration.shouldNormalizeSeedOrder(
        { delivery: { type: "pickup" }, subtotal: 80 },
        35
      )
    ).toBe(false);

    expect(
      migration.shouldNormalizeSeedOrder(
        { delivery: { type: "delivery" }, subtotal: 15 },
        25
      )
    ).toBe(false);
  });
});
