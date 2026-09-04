jest.mock('../../src/config/redis', () => ({
  getRedisClient: jest.fn(),
  isRedisReady: jest.fn()
}));

const { getRedisClient, isRedisReady } = require('../../src/config/redis');
const {
  syncDriverGeo,
  findNearestDrivers,
  coordsFromDriver
} = require('../../src/services/driverGeoService');

describe('driverGeoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('coordsFromDriver reads GeoJSON [lng, lat]', () => {
    expect(
      coordsFromDriver({
        location: { type: 'Point', coordinates: [2.35, 48.85] }
      })
    ).toEqual({ lng: 2.35, lat: 48.85 });
  });

  test('coordsFromDriver ignores [0,0] placeholder', () => {
    expect(
      coordsFromDriver({ location: { type: 'Point', coordinates: [0, 0] } })
    ).toBeNull();
  });

  test('syncDriverGeo upserts available driver into GEO index', async () => {
    const geoAdd = jest.fn().mockResolvedValue(1);
    const zRem = jest.fn().mockResolvedValue(1);
    getRedisClient.mockResolvedValue({ geoAdd, zRem, isOpen: true });

    const result = await syncDriverGeo({
      _id: 'dddddddddddddddddddddddd',
      status: 'available',
      location: { type: 'Point', coordinates: [9.7, 4.05] }
    });

    expect(result.action).toBe('upsert');
    expect(geoAdd).toHaveBeenCalledWith('drivers:geo', {
      longitude: 9.7,
      latitude: 4.05,
      member: 'dddddddddddddddddddddddd'
    });
    expect(zRem).not.toHaveBeenCalled();
  });

  test('syncDriverGeo removes offline driver from GEO index', async () => {
    const geoAdd = jest.fn();
    const zRem = jest.fn().mockResolvedValue(1);
    getRedisClient.mockResolvedValue({ geoAdd, zRem, isOpen: true });

    const result = await syncDriverGeo({
      _id: 'dddddddddddddddddddddddd',
      status: 'offline',
      location: { type: 'Point', coordinates: [9.7, 4.05] }
    });

    expect(result.action).toBe('remove');
    expect(zRem).toHaveBeenCalledWith('drivers:geo', 'dddddddddddddddddddddddd');
    expect(geoAdd).not.toHaveBeenCalled();
  });

  test('findNearestDrivers uses GEOSEARCH WITHDIST ASC', async () => {
    const geoSearchWith = jest.fn().mockResolvedValue([
      { member: 'driver-a', distance: 0.42 },
      { member: 'driver-b', distance: 1.1 }
    ]);
    getRedisClient.mockResolvedValue({ geoSearchWith, isOpen: true });
    isRedisReady.mockReturnValue(true);

    const result = await findNearestDrivers({
      lng: 9.7,
      lat: 4.05,
      radiusKm: 3,
      count: 10
    });

    expect(result.engine).toBe('redis-geosearch');
    expect(result.drivers).toEqual([
      { driverId: 'driver-a', distanceKm: 0.42 },
      { driverId: 'driver-b', distanceKm: 1.1 }
    ]);
    expect(geoSearchWith).toHaveBeenCalledWith(
      'drivers:geo',
      { longitude: 9.7, latitude: 4.05 },
      { radius: 3, unit: 'km' },
      ['WITHDIST'],
      { SORT: 'ASC', COUNT: 10 }
    );
  });

  test('findNearestDrivers returns unavailable when Redis is down', async () => {
    getRedisClient.mockResolvedValue(null);
    isRedisReady.mockReturnValue(false);

    const result = await findNearestDrivers({ lng: 9.7, lat: 4.05 });
    expect(result.engine).toBe('unavailable');
    expect(result.drivers).toEqual([]);
  });
});
