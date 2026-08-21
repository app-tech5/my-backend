const migration = require("../../migrations/16-orders-fix-absurd-delivery-fees");

describe("migration 16-orders-fix-absurd-delivery-fees", () => {
  const parisRestaurant = {
    latitude: "48.8699804",
    longitude: "2.3638343"
  };

  const nearbyUser = {
    location: { latitude: 48.87, longitude: 2.37 }
  };

  it("computes haversine distance between restaurant and user", () => {
    const distance = migration.getDistanceKmBetweenUserAndRestaurant(
      parisRestaurant,
      nearbyUser.location
    );
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(5);
  });

  it("returns 0 for pickup orders", () => {
    const fee = migration.resolveDeliveryFee(
      { delivery: { type: "pickup" }, subtotal: 50 },
      { fixedDeliveryFee: 3 },
      parisRestaurant,
      nearbyUser
    );
    expect(fee).toBe(0);
  });

  it("returns 0 when free delivery is enabled", () => {
    const fee = migration.resolveDeliveryFee(
      { delivery: { type: "delivery" }, subtotal: 10 },
      { deliveryFeeType: "FREE", freeDeliveryEnabled: true, fixedDeliveryFee: 3 },
      parisRestaurant,
      nearbyUser
    );
    expect(fee).toBe(0);
  });

  it("returns 0 when subtotal meets free delivery threshold", () => {
    const fee = migration.resolveDeliveryFee(
      { delivery: { type: "delivery" }, subtotal: 40 },
      {
        deliveryFeeType: "FIXED",
        freeDeliveryEnabled: false,
        freeDeliveryThreshold: 35,
        fixedDeliveryFee: 3
      },
      parisRestaurant,
      nearbyUser
    );
    expect(fee).toBe(0);
  });

  it("calculates dynamic fee from distance and clamps to min/max", () => {
    const fee = migration.calculateDeliveryFeeFromSetting(
      {
        deliveryFeeType: "DYNAMIC",
        dynamicDeliveryFee: {
          baseFee: 1.5,
          perKmFee: 0.5,
          minFee: 2,
          maxFee: 10
        }
      },
      4
    );
    expect(fee).toBe(3.5);
  });

  it("falls back to fixed fee when distance is unavailable", () => {
    const fee = migration.resolveDeliveryFee(
      { delivery: { type: "delivery" }, subtotal: 10 },
      {
        deliveryFeeType: "DYNAMIC",
        dynamicDeliveryFee: { baseFee: 1.5, perKmFee: 0.5, minFee: 2, maxFee: 10 },
        fixedDeliveryFee: 2.99
      },
      parisRestaurant,
      { location: null }
    );
    expect(fee).toBe(2.99);
  });

  it("flags absurd stored fees and pickup fees", () => {
    expect(
      migration.needsDeliveryFeeFix(
        { delivery: { type: "pickup", deliveryFee: 1222 } },
        0
      )
    ).toBe(true);

    expect(
      migration.needsDeliveryFeeFix(
        { delivery: { type: "delivery", deliveryFee: 800 }, subtotal: 20 },
        3.5
      )
    ).toBe(true);

    expect(
      migration.needsDeliveryFeeFix(
        { delivery: { type: "delivery", deliveryFee: 3.5 }, subtotal: 20 },
        3.5
      )
    ).toBe(false);
  });

  it("recalculates totalPrice with corrected delivery fee", () => {
    const totals = migration.recalculateOrderTotals(
      { subtotal: 20, tax: { rate: 0.1 } },
      3.5
    );
    expect(totals.taxAmount).toBe(2);
    expect(totals.totalPrice).toBe(25.5);
  });
});
