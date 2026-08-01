/**
 * Scrub real-world Bonabéri / Douala geo from demo data.
 *
 * - Demo Kitchen restaurant was reverse-geocoded to Cameroun coords
 * - driver2 live location still pointed at Bonabéri
 *
 * Relocate both to coherent Paris demo coordinates.
 */

const { ObjectId } = require('mongodb');

const SEED_KEY = 'migration_36_scrub_bonaberi_geo';
const BACKUP_COLLECTION = '_migration_36_bonaberi_geo_backups';

const DEMO_KITCHEN_ID = '6a0bb46f934ef0c94535abae';
const DRIVER2_ID = '6a2065b696423015a69ae400';

const PARIS_RESTAURANT = {
  latitude: '48.8601220',
  longitude: '2.3373234',
  address: 'Place du Musée du Louvre, 75001 Paris',
  city: 'Paris',
  country: 'France',
};

// GeoJSON [longitude, latitude]
const PARIS_DRIVER_POINT = {
  type: 'Point',
  coordinates: [2.3409458, 48.8729866],
};

function isCameroonishCoords(lon, lat) {
  const longitude = Number(lon);
  const latitude = Number(lat);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return false;
  return longitude > 8 && longitude < 11 && latitude > 3 && latitude < 5.5;
}

function hasBonaberiText(doc = {}) {
  return /bonab|douala|cameroun|cameroon/i.test(
    `${doc.address || ''} ${doc.city || ''} ${doc.country || ''}`
  );
}

module.exports = {
  SEED_KEY,
  BACKUP_COLLECTION,
  DEMO_KITCHEN_ID,
  DRIVER2_ID,
  PARIS_RESTAURANT,
  PARIS_DRIVER_POINT,
  isCameroonishCoords,
  hasBonaberiText,

  async up(db) {
    const backups = db.collection(BACKUP_COLLECTION);
    await backups.deleteMany({ seedKey: SEED_KEY });

    const restaurants = db.collection('restaurants');
    const drivers = db.collection('drivers');

    const restaurant = await restaurants.findOne({
      _id: new ObjectId(DEMO_KITCHEN_ID),
    });

    if (
      restaurant &&
      (isCameroonishCoords(restaurant.longitude, restaurant.latitude) ||
        hasBonaberiText(restaurant))
    ) {
      await backups.insertOne({
        seedKey: SEED_KEY,
        kind: 'restaurant',
        _id: restaurant._id,
        previous: {
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
          address: restaurant.address,
          city: restaurant.city,
          country: restaurant.country,
          migrationSeedPrevious: restaurant.migrationSeedPrevious || null,
        },
        createdAt: new Date(),
      });

      await restaurants.updateOne(
        { _id: restaurant._id },
        {
          $set: {
            ...PARIS_RESTAURANT,
          },
          $unset: {
            migrationSeedPrevious: '',
          },
        }
      );
      console.log(`✅ Demo Kitchen relocated to Paris (${DEMO_KITCHEN_ID})`);
    } else {
      console.log('ℹ️ Demo Kitchen already Paris-safe (skipped)');
    }

    const driver = await drivers.findOne({ _id: new ObjectId(DRIVER2_ID) });
    const driverCoords = driver?.location?.coordinates || [];
    if (
      driver &&
      isCameroonishCoords(driverCoords[0], driverCoords[1])
    ) {
      await backups.insertOne({
        seedKey: SEED_KEY,
        kind: 'driver',
        _id: driver._id,
        previous: {
          location: driver.location,
        },
        createdAt: new Date(),
      });

      await drivers.updateOne(
        { _id: driver._id },
        {
          $set: {
            location: PARIS_DRIVER_POINT,
          },
        }
      );
      console.log(`✅ Driver2 location relocated to Paris (${DRIVER2_ID})`);
    } else {
      console.log('ℹ️ Driver2 location already Paris-safe (skipped)');
    }

    // Catch-all: any remaining Cameroon-ish restaurant/driver rows
    const extraRestaurants = await restaurants
      .find({})
      .project({
        name: 1,
        address: 1,
        city: 1,
        country: 1,
        latitude: 1,
        longitude: 1,
      })
      .toArray();

    let extraRestFixed = 0;
    for (const row of extraRestaurants) {
      if (String(row._id) === DEMO_KITCHEN_ID) continue;
      if (
        !isCameroonishCoords(row.longitude, row.latitude) &&
        !hasBonaberiText(row)
      ) {
        continue;
      }
      await backups.insertOne({
        seedKey: SEED_KEY,
        kind: 'restaurant_extra',
        _id: row._id,
        previous: {
          latitude: row.latitude,
          longitude: row.longitude,
          address: row.address,
          city: row.city,
          country: row.country,
        },
        createdAt: new Date(),
      });
      await restaurants.updateOne(
        { _id: row._id },
        { $set: { ...PARIS_RESTAURANT } }
      );
      extraRestFixed += 1;
    }

    const extraDrivers = await drivers
      .find({})
      .project({ location: 1 })
      .toArray();
    let extraDriversFixed = 0;
    for (const row of extraDrivers) {
      if (String(row._id) === DRIVER2_ID) continue;
      const coords = row.location?.coordinates || [];
      if (!isCameroonishCoords(coords[0], coords[1])) continue;
      await backups.insertOne({
        seedKey: SEED_KEY,
        kind: 'driver_extra',
        _id: row._id,
        previous: { location: row.location },
        createdAt: new Date(),
      });
      await drivers.updateOne(
        { _id: row._id },
        { $set: { location: PARIS_DRIVER_POINT } }
      );
      extraDriversFixed += 1;
    }

    if (extraRestFixed || extraDriversFixed) {
      console.log(
        `✅ Extra scrub: ${extraRestFixed} restaurant(s), ${extraDriversFixed} driver(s)`
      );
    }
  },

  async down(db) {
    const backups = await db
      .collection(BACKUP_COLLECTION)
      .find({ seedKey: SEED_KEY })
      .toArray();

    for (const backup of backups) {
      if (backup.kind === 'restaurant' || backup.kind === 'restaurant_extra') {
        const set = { ...backup.previous };
        const unset = {};
        if (!backup.previous.migrationSeedPrevious) {
          delete set.migrationSeedPrevious;
          unset.migrationSeedPrevious = '';
        }
        const update = { $set: set };
        if (Object.keys(unset).length) update.$unset = unset;
        await db.collection('restaurants').updateOne({ _id: backup._id }, update);
      }
      if (backup.kind === 'driver' || backup.kind === 'driver_extra') {
        await db.collection('drivers').updateOne(
          { _id: backup._id },
          { $set: { location: backup.previous.location } }
        );
      }
    }

    await db.collection(BACKUP_COLLECTION).deleteMany({ seedKey: SEED_KEY });
    console.log(`↩️ Migration 36 rolled back (${backups.length} doc(s))`);
  },
};
