
const SEED_KEY = 'migration_35_notificationsettings_coherent_users';

function oid(id) {
  return id;
}

function uniqueById(list) {
  const seen = new Set();
  return list.filter((u) => {
    const id = String(u._id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function preferEmails(users, preferredEmails) {
  const preferred = [];
  const rest = [...users];
  for (const email of preferredEmails) {
    const idx = rest.findIndex((u) => u.email === email);
    if (idx >= 0) preferred.push(...rest.splice(idx, 1));
  }
  return [...preferred, ...rest];
}

module.exports = {
  async up(db) {
    const users = await db.
    collection('users').
    find({}).
    project({ _id: 1, email: 1, role: 1, name: 1 }).
    toArray();

    const byRole = (role) => users.filter((u) => u.role === role);

    const restaurants = await db.
    collection('restaurants').
    find({}).
    project({ name: 1, users: 1, owner: 1 }).
    toArray();
    const ownerIdSet = new Set(
      restaurants.
      map((r) => String(r.users?.value || r.owner || '')).
      filter((id) => /^[a-f0-9]{24}$/i.test(id))
    );
    const restaurantOwners = preferEmails(
      uniqueById(
        byRole('restaurant').filter((u) => ownerIdSet.has(String(u._id)))
      ),
      ['demo@restaurant.com']
    );

    const restaurantPool = restaurantOwners.length ?
    restaurantOwners :
    preferEmails(byRole('restaurant'), ['demo@restaurant.com']);

    const drivers = await db.
    collection('drivers').
    find({}).
    project({ userId: 1 }).
    toArray();
    const driverUserIdSet = new Set(
      drivers.map((d) => String(d.userId || '')).filter(Boolean)
    );
    const linkedDelivery = preferEmails(
      uniqueById(
        byRole('delivery').filter((u) => driverUserIdSet.has(String(u._id)))
      ),
      ['driver@demo.com', 'driver1@gmail.com', 'driver2@gmail.com']
    );
    const driverPool = linkedDelivery.length ?
    linkedDelivery :
    preferEmails(byRole('delivery'), [
    'driver@demo.com',
    'driver1@gmail.com',
    'driver2@gmail.com']
    );

    const pools = {
      admin: preferEmails(byRole('admin'), ['admin@example.com']),
      restaurant: restaurantPool,
      driver: driverPool,
      customer: preferEmails(byRole('customer'), [
      'demo@customer.com',
      'demo1@gmail.com']
      )
    };

    const settings = await db.
    collection('notificationsettings').
    find({}).
    sort({ userType: 1, createdAt: 1, _id: 1 }).
    toArray();

    const usedByType = {
      admin: 0,
      restaurant: 0,
      driver: 0,
      customer: 0
    };

    let updated = 0;
    const assignments = [];

    for (const doc of settings) {
      const type = doc.userType || 'customer';
      const pool = pools[type] || pools.customer;
      if (!pool.length) continue;

      const idx = usedByType[type] % pool.length;
      usedByType[type] += 1;
      const user = pool[idx];

      await db.collection('notificationsettings').updateOne(
        { _id: doc._id },
        {
          $set: {
            userId: user._id,
            migrationSeedKey: SEED_KEY,
            migrationSeedPreviousUserId: doc.userId ?? null
          }
        }
      );

      assignments.push({
        userType: type,
        email: user.email,
        name: user.name
      });
      updated += 1;
    }

    console.log(`  ✓ Coherent user links on ${updated} notification settings`);
    assignments.forEach((a) =>
    console.log(`    - ${a.userType.padEnd(11)} → ${a.email} (${a.name})`)
    );
  },

  async down(db) {
    const docs = await db.
    collection('notificationsettings').
    find({ migrationSeedKey: SEED_KEY }).
    toArray();

    for (const doc of docs) {
      const prev = doc.migrationSeedPreviousUserId;
      if (prev == null) {
        await db.collection('notificationsettings').updateOne(
          { _id: doc._id },
          {
            $unset: {
              userId: '',
              migrationSeedKey: '',
              migrationSeedPreviousUserId: ''
            }
          }
        );
      } else {
        await db.collection('notificationsettings').updateOne(
          { _id: doc._id },
          {
            $set: { userId: prev },
            $unset: {
              migrationSeedKey: '',
              migrationSeedPreviousUserId: ''
            }
          }
        );
      }
    }

    console.log(`  ✓ Reverted ${docs.length} coherent notification setting links`);
  }
};
