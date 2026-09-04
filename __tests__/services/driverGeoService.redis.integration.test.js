/**
 * Runs only when REDIS_URL is set (GitHub Actions redis service).
 * Never requires Redis on a developer Mac.
 */
const describeRedis = process.env.REDIS_URL ? describe : describe.skip;

describeRedis('driverGeoService Redis GEOSEARCH (CI)', () => {
  let geo;
  let redisCfg;

  beforeAll(() => {
    geo = require('../../src/services/driverGeoService');
    redisCfg = require('../../src/config/redis');
  });

  afterAll(async () => {
    if (geo?.clearDriverGeoIndex) await geo.clearDriverGeoIndex();
    if (redisCfg?.closeRedis) await redisCfg.closeRedis();
  });

  test('GEOADD + GEOSEARCH returns nearest member', async () => {
    await geo.clearDriverGeoIndex();
    await geo.upsertDriverInGeo('ci-driver-near', 2.3522, 48.8566);
    await geo.upsertDriverInGeo('ci-driver-far', 2.45, 48.9);

    const result = await geo.findNearestDrivers({
      lng: 2.3522,
      lat: 48.8566,
      radiusKm: 2,
      count: 5
    });

    expect(result.engine).toBe('redis-geosearch');
    expect(result.drivers.length).toBeGreaterThanOrEqual(1);
    expect(result.drivers[0].driverId).toBe('ci-driver-near');
    expect(result.drivers.some((d) => d.driverId === 'ci-driver-far')).toBe(false);
  });
});
