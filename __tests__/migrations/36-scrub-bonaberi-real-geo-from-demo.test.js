const {
  isCameroonishCoords,
  hasBonaberiText,
  PARIS_RESTAURANT,
  PARIS_DRIVER_POINT,
  DEMO_KITCHEN_ID,
  DRIVER2_ID,
} = require('../../migrations/36-scrub-bonaberi-real-geo-from-demo');

describe('migration 36 scrub bonaberi geo', () => {
  it('detects Cameroon bbox and Bonabéri text', () => {
    expect(isCameroonishCoords(9.6649718, 4.0822098)).toBe(true);
    expect(isCameroonishCoords(2.3373234, 48.860122)).toBe(false);
    expect(hasBonaberiText({ address: 'Bonaberi, Douala', city: 'Douala' })).toBe(
      true
    );
    expect(hasBonaberiText({ address: 'Louvre', city: 'Paris' })).toBe(false);
  });

  it('exposes Paris demo targets for known demo ids', () => {
    expect(DEMO_KITCHEN_ID).toMatch(/^[a-f0-9]{24}$/i);
    expect(DRIVER2_ID).toMatch(/^[a-f0-9]{24}$/i);
    expect(PARIS_RESTAURANT.city).toBe('Paris');
    expect(PARIS_RESTAURANT.country).toBe('France');
    expect(PARIS_DRIVER_POINT.coordinates).toEqual([2.3409458, 48.8729866]);
  });
});
