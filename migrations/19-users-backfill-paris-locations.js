/**
 * Backfill `location` + `address` for users without valid GPS coordinates.
 *
 * Assigns each user a distinct Paris address/coordinate pair (seeded shuffle).
 * Stores previous values in `_migration_19_user_location_backups` for rollback.
 */

const { ObjectId } = require('mongodb');

const BACKUP_COLLECTION = '_migration_19_user_location_backups';
const SHUFFLE_SEED = 20260618;

const PARIS_USER_LOCATIONS = [
  { latitude: 48.8729866, longitude: 2.3409458, address: '1 Rue Rossini, 75009 Paris' },
  { latitude: 48.865666, longitude: 2.378607, address: 'Cité du Figuier, 75011 Paris' },
  { latitude: 48.8644978, longitude: 2.3753724, address: '82 Avenue Parmentier, 75011 Paris' },
  { latitude: 48.8667056, longitude: 2.3680178, address: 'Avenue de la République, 75011 Paris' },
  { latitude: 48.8642245, longitude: 2.3376685, address: 'Allée Colette, 75001 Paris' },
  { latitude: 48.8714532, longitude: 2.3756507, address: '108-110 Rue du Faubourg du Temple, 75011 Paris' },
  { latitude: 48.8729306, longitude: 2.3798134, address: 'Rue Rampal, 75019 Paris' },
  { latitude: 48.8715899, longitude: 2.3487251, address: "Rue de l'Échiquier, 75010 Paris" },
  { latitude: 48.8606245, longitude: 2.3674548, address: 'Rue Saint-Sébastien, 75011 Paris' },
  { latitude: 48.8637215, longitude: 2.320281, address: 'Quai des Tuileries, 75001 Paris' },
  { latitude: 48.8583438, longitude: 2.3285171, address: 'Rue du Bac, 75007 Paris' },
  { latitude: 48.860122, longitude: 2.3373234, address: 'Place du Musée du Louvre, 75001 Paris' },
  { latitude: 48.8671455, longitude: 2.3330315, address: '33 Rue de la Sourdière, 75001 Paris' },
  { latitude: 48.8632096, longitude: 2.3298966, address: 'Allée de Castiglione, 75001 Paris' },
  { latitude: 48.8734357, longitude: 2.3722429, address: '13 Passage Hébrard, 75010 Paris' },
  { latitude: 48.8704125, longitude: 2.3316108, address: 'Boulevard des Capucines, 75009 Paris' },
  { latitude: 48.867092, longitude: 2.3314284, address: '43 Place du Marché Saint-Honoré, 75001 Paris' },
  { latitude: 48.8699804, longitude: 2.3638343, address: '1 Rue Dieu, 75010 Paris' },
  { latitude: 48.8732532, longitude: 2.3332616, address: "Rue de la Chaussée d'Antin, 75009 Paris" },
  { latitude: 48.8659726, longitude: 2.32603, address: '1 Rue Rouget de Lisle, 75001 Paris' },
  { latitude: 48.8391964, longitude: 2.382849, address: 'Gare de Bercy, 75012 Paris' },
  { latitude: 48.8534951, longitude: 2.3483915, address: '10 Rue Saint-Julien-le-Pauvre, 75005 Paris' },
  { latitude: 48.8462214, longitude: 2.3549634, address: '15 Rue de la Colonie, 75013 Paris' },
  { latitude: 48.8818427, longitude: 2.3182192, address: '22 Rue Cardinet, 75017 Paris' },
  { latitude: 48.8767612, longitude: 2.2959055, address: '8 Rue de la Fédération, 75015 Paris' },
  { latitude: 48.8448548, longitude: 2.3738833, address: '5 Rue de Picpus, 75012 Paris' },
  { latitude: 48.8924275, longitude: 2.3448972, address: '12 Rue Ramey, 75018 Paris' },
  { latitude: 48.8345672, longitude: 2.3264158, address: '3 Place d\'Italie, 75013 Paris' },
  { latitude: 48.8575475, longitude: 2.3513765, address: '4 Place Saint-Michel, 75005 Paris' },
  { latitude: 48.8686331, longitude: 2.2977629, address: '18 Rue de la Procession, 75015 Paris' },
];

const PARIS_STREET_NAMES = [
  'Rue de Rivoli',
  'Rue du Faubourg Saint-Antoine',
  'Rue de Charonne',
  'Rue de la Roquette',
  'Rue de Belleville',
  'Rue de Tolbiac',
  'Rue de Vaugirard',
  'Rue de la Pompe',
  'Rue de la Convention',
  'Rue de la Boétie',
  'Rue de la Harpe',
  'Rue des Martyrs',
  'Rue des Pyrenées',
  'Rue de Passy',
  'Rue de Turenne',
  'Rue du Cherche-Midi',
  'Rue du Commerce',
  'Rue du Faubourg Poissonnière',
  'Avenue de Wagram',
  'Boulevard Haussmann',
];

function locationKey(spot) {
  return `${spot.latitude.toFixed(6)}:${spot.longitude.toFixed(6)}`;
}

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1103515245 + 12345) >>> 0;
    return state / 0x7fffffff;
  };
}

function generateParisLocation(slot, seed = SHUFFLE_SEED) {
  const rand = createSeededRandom(seed + slot * 9973);
  const latitude = Number((48.815 + rand() * 0.087).toFixed(7));
  const longitude = Number((2.252 + rand() * 0.17).toFixed(7));
  const arrondissement = String(75001 + Math.floor(rand() * 20)).padStart(5, '0');
  const streetNumber = 1 + Math.floor(rand() * 150);
  const streetName = PARIS_STREET_NAMES[Math.floor(rand() * PARIS_STREET_NAMES.length)];

  return {
    latitude,
    longitude,
    address: `${streetNumber} ${streetName}, ${arrondissement} Paris`,
  };
}

function buildParisLocationPool(count, seed = SHUFFLE_SEED) {
  const used = new Set();
  const pool = [];

  const addSpot = (spot) => {
    const key = locationKey(spot);
    if (used.has(key)) {
      return false;
    }
    used.add(key);
    pool.push(spot);
    return true;
  };

  seededShuffle(PARIS_USER_LOCATIONS, seed).forEach((spot) => {
    if (pool.length < count) {
      addSpot(spot);
    }
  });

  let slot = 0;
  while (pool.length < count) {
    addSpot(generateParisLocation(slot, seed));
    slot += 1;
  }

  return seededShuffle(pool, seed + 1).slice(0, count);
}

function hasValidLocation(user) {
  const lat = user?.location?.latitude;
  const lon = user?.location?.longitude;
  return Number.isFinite(lat) && Number.isFinite(lon) && !(lat === 0 && lon === 0);
}

function userMissingLocationQuery() {
  return {
    role: { $ne: 'admin' },
    $or: [
      { location: { $exists: false } },
      { location: null },
      { 'location.latitude': { $not: { $type: 'number' } } },
      { 'location.longitude': { $not: { $type: 'number' } } },
    ],
  };
}

function seededShuffle(items, seed) {
  const arr = [...items];
  let state = seed >>> 0;

  for (let i = arr.length - 1; i > 0; i -= 1) {
    state = (state * 1103515245 + 12345) >>> 0;
    const j = state % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function assignParisLocations(users, seed = SHUFFLE_SEED) {
  const locations = buildParisLocationPool(users.length, seed);

  return users.map((user, index) => {
    const spot = locations[index];
    return {
      userId: user._id,
      previous: {
        address: user.address ?? '',
        hadValidLocation: hasValidLocation(user),
        location: user.location ?? null,
      },
      next: {
        address: spot.address,
        location: {
          latitude: spot.latitude,
          longitude: spot.longitude,
        },
      },
    };
  });
}

async function up(db) {
  const usersCol = db.collection('users');
  const backupCol = db.collection(BACKUP_COLLECTION);

  const users = await usersCol
    .find(userMissingLocationQuery())
    .sort({ _id: 1 })
    .toArray();

  if (users.length === 0) {
    console.log('✅ Aucun user sans location à corriger');
    return;
  }

  const assignments = assignParisLocations(users);

  for (const assignment of assignments) {
    await backupCol.updateOne(
      { userId: assignment.userId },
      {
        $set: {
          userId: assignment.userId,
          previous: assignment.previous,
          next: assignment.next,
          migratedAt: new Date(),
        },
      },
      { upsert: true }
    );

    const result = await usersCol.updateOne(
      { _id: assignment.userId },
      {
        $set: {
          address: assignment.next.address,
          location: assignment.next.location,
        },
      }
    );

    if (result.matchedCount === 0) {
      console.warn(`⚠️ User ${assignment.userId} introuvable`);
    }
  }

  console.log(`✅ ${assignments.length} user(s) mis à jour avec une location Paris`);
}

async function down(db) {
  const usersCol = db.collection('users');
  const backupCol = db.collection(BACKUP_COLLECTION);

  const backups = await backupCol.find({}).toArray();

  for (const backup of backups) {
    const update = {
      $set: {
        address: backup.previous.address,
      },
    };

    if (backup.previous.hadValidLocation && backup.previous.location) {
      update.$set.location = backup.previous.location;
    } else {
      update.$unset = { location: '' };
    }

    await usersCol.updateOne({ _id: backup.userId }, update);
  }

  await backupCol.deleteMany({});
  console.log(`↩️ ${backups.length} user(s) restauré(s)`);
}

module.exports = {
  BACKUP_COLLECTION,
  PARIS_USER_LOCATIONS,
  PARIS_STREET_NAMES,
  SHUFFLE_SEED,
  hasValidLocation,
  userMissingLocationQuery,
  seededShuffle,
  buildParisLocationPool,
  generateParisLocation,
  assignParisLocations,
  up,
  down,
};
