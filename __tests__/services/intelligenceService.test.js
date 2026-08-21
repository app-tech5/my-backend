const {
  hourBucket,
  isRushHour,
  haversineKm,
  getRecommendations,
  getSmartEta,
  getSurgePricing
} = require('../../src/services/intelligenceService');

describe('intelligenceService helpers', () => {
  test('hourBucket maps morning to breakfast', () => {
    const d = new Date('2026-08-03T08:30:00');
    expect(hourBucket(d)).toBe('breakfast');
  });

  test('isRushHour detects evening peak', () => {
    expect(isRushHour(new Date('2026-08-03T18:15:00'))).toBe(true);
    expect(isRushHour(new Date('2026-08-03T03:00:00'))).toBe(false);
  });

  test('haversineKm returns ~0 for same point', () => {
    expect(haversineKm(48.85, 2.35, 48.85, 2.35)).toBeCloseTo(0, 5);
  });
});

describe('intelligenceService APIs (mocked models)', () => {
  const Order = require('../../src/models/Order');
  const Product = require('../../src/models/Product');
  const Driver = require('../../src/models/Driver');
  const DeliverySetting = require('../../src/models/DeliverySetting');
  const Restaurant = require('../../src/models/Restaurant');

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('getRecommendations returns scored products', async () => {
    jest.spyOn(Order, 'find').mockReturnValue({
      select: () => ({
        sort: () => ({
          limit: () => ({
            lean: async () => [
            {
              items: [
              { item: 'aaaaaaaaaaaaaaaaaaaaaaaa' },
              { item: 'bbbbbbbbbbbbbbbbbbbbbbbb' }]

            }]

          })
        })
      })
    });
    jest.spyOn(Product, 'find').mockReturnValue({
      select: () => ({
        limit: () => ({
          lean: async () => [
          {
            _id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
            name: 'Soup Bowl',
            tags: ['soup', 'comfort'],
            rating: { average: 4.5, count: 20 },
            discount: { isActive: false }
          },
          {
            _id: 'cccccccccccccccccccccccc',
            name: 'Iced Juice',
            tags: ['drink', 'cold'],
            rating: { average: 4.1, count: 8 },
            discount: { isActive: false }
          }]

        })
      })
    });

    const result = await getRecommendations({
      restaurantId: 'rrrrrrrrrrrrrrrrrrrrrrrr',
      productIds: ['aaaaaaaaaaaaaaaaaaaaaaaa'],
      lat: 48.85,
      lng: 2.35,
      limit: 5
    });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.context.timeOfDay).toBeTruthy();
    expect(result.context.weather).toBeTruthy();
  });

  test('getSmartEta includes kitchen and travel factors', async () => {
    jest.spyOn(DeliverySetting, 'findOne').mockReturnValue({
      lean: async () => ({ deliveryPreparationTime: 25 })
    });
    jest.spyOn(Restaurant, 'findById').mockReturnValue({
      select: () => ({
        lean: async () => ({
          latitude: 48.86,
          longitude: 2.35,
          name: 'Demo'
        })
      })
    });
    jest.spyOn(Order, 'countDocuments').mockResolvedValue(3);

    const eta = await getSmartEta({
      restaurantId: 'rrrrrrrrrrrrrrrrrrrrrrrr',
      lat: 48.85,
      lng: 2.34
    });
    expect(eta.minMinutes).toBeGreaterThan(0);
    expect(eta.maxMinutes).toBeGreaterThanOrEqual(eta.minMinutes);
    expect(eta.factors.kitchenOrdersInProgress).toBe(3);
  });

  test('getSurgePricing returns multiplier structure', async () => {
    jest.spyOn(Order, 'countDocuments').mockResolvedValue(8);
    jest.spyOn(Driver, 'countDocuments').mockResolvedValue(2);
    const surge = await getSurgePricing({
      restaurantId: 'rrrrrrrrrrrrrrrrrrrrrrrr',
      lat: 48.85,
      lng: 2.35
    });
    expect(surge.multiplier).toBeGreaterThanOrEqual(1);
    expect(typeof surge.active).toBe('boolean');
    expect(surge.factors.onlineDrivers).toBe(2);
  });
});
