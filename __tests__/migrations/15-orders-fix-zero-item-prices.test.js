const migration = require("../../migrations/15-orders-fix-zero-item-prices");

describe("migration 15-orders-fix-zero-item-prices", () => {
  it("includes variant extras in line totals", () => {
    expect(migration.getVariantsTotal([{ extra: 2, price: 4 }])).toBe(2);
    expect(migration.getVariantsTotal([{ price: 4 }])).toBe(4);
  });

  it("recalculates order totals from normalized items", () => {
    const totals = migration.recalculateOrderTotals(
      [{ total: 10 }, { total: 5 }],
      { tax: { rate: 0.2 }, delivery: { deliveryFee: 3 } }
    );

    expect(totals.subtotal).toBe(15);
    expect(totals.taxAmount).toBe(3);
    expect(totals.totalPrice).toBe(21);
  });
});
