const {
  haversineKm,
  findBatchCandidates
} = require('../../src/services/logisticsService');

describe('logisticsService helpers', () => {
  test('haversineKm ~0 for same point', () => {
    expect(haversineKm(48.85, 2.35, 48.85, 2.35)).toBeCloseTo(0, 5);
  });
});

describe('findBatchCandidates (mocked)', () => {
  const Order = require('../../src/models/Order');
  const DeliverySetting = require('../../src/models/DeliverySetting');

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('returns nearby candidates within radius', async () => {
    jest.spyOn(Order, 'findById').mockReturnValue({
      lean: async () => ({
        _id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
        restaurant: 'rrrrrrrrrrrrrrrrrrrrrrrr',
        delivery: { type: 'delivery', address: 'A' },
        user: { location: { coordinates: [2.35, 48.85] } },
        restaurant: { _id: 'rrrrrrrrrrrrrrrrrrrrrrrr', latitude: 48.86, longitude: 2.35 }
      })
    });
    jest.spyOn(DeliverySetting, 'findOne').mockReturnValue({
      lean: async () => ({ autoAssignmentRadius: 3 })
    });
    jest.spyOn(Order, 'find').mockReturnValue({
      limit: () => ({
        lean: async () => [
        {
          _id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
          restaurant: 'rrrrrrrrrrrrrrrrrrrrrrrr',
          delivery: { type: 'delivery', address: 'B' },
          status: 'ready',
          user: { location: { coordinates: [2.351, 48.851] } }
        },
        {
          _id: 'cccccccccccccccccccccccc',
          restaurant: 'other',
          delivery: { type: 'delivery', address: 'Far' },
          status: 'ready',
          user: { location: { coordinates: [3.0, 49.5] } }
        }]

      })
    });

    const result = await findBatchCandidates({
      orderId: 'aaaaaaaaaaaaaaaaaaaaaaaa',
      driverId: 'dddddddddddddddddddddddd'
    });
    expect(result.candidates.length).toBe(1);
    expect(String(result.candidates[0].order._id)).toBe('bbbbbbbbbbbbbbbbbbbbbbbb');
  });
});
