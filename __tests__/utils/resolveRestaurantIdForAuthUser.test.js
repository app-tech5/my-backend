const { resolveRestaurantIdForAuthUser } = require('../../src/utils/resolveRestaurantIdForAuthUser');

jest.mock('../../src/models/User', () => ({
  findById: jest.fn()
}));

jest.mock('../../src/models/Restaurant', () => ({
  findOne: jest.fn()
}));

const User = require('../../src/models/User');
const Restaurant = require('../../src/models/Restaurant');

describe('resolveRestaurantIdForAuthUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses restaurant id from jwt payload', async () => {
    const restaurantId = '695d17d9ed0284bc20edc5b7';
    const result = await resolveRestaurantIdForAuthUser({
      id: '6989322d80e02f73898de666',
      type: 'restaurant',
      restaurant: restaurantId
    });

    expect(result).toBe(restaurantId);
    expect(User.findById).not.toHaveBeenCalled();
  });

  it('falls back to user.restaurant field', async () => {
    User.findById.mockReturnValue({
      select: () => ({
        lean: async () => ({ restaurant: 'abc123' })
      })
    });

    const result = await resolveRestaurantIdForAuthUser({
      id: 'user1',
      type: 'restaurant'
    });

    expect(result).toBe('abc123');
  });

  it('falls back to restaurant.users.value lookup', async () => {
    User.findById.mockReturnValue({
      select: () => ({
        lean: async () => ({ restaurant: null })
      })
    });
    Restaurant.findOne.mockReturnValue({
      select: () => ({
        lean: async () => ({ _id: 'fromUsersValue' })
      })
    });

    const result = await resolveRestaurantIdForAuthUser({
      id: 'user1',
      type: 'restaurant'
    });

    expect(result).toBe('fromUsersValue');
  });
});
