
const SEED_KEY = 'migration_33_notificationsettings_backfill_userids';

module.exports = {
  async up(db) {
    const usersByRole = {};
    const users = await db.
    collection('users').
    find({}).
    project({ _id: 1, role: 1, email: 1 }).
    toArray();

    for (const u of users) {
      const role = u.role || 'customer';
      if (!usersByRole[role]) usersByRole[role] = [];
      usersByRole[role].push(u);
    }

    const settings = await db.collection('notificationsettings').find({}).toArray();
    let updated = 0;

    for (let i = 0; i < settings.length; i++) {
      const doc = settings[i];
      const role = doc.userType || 'customer';
      const pool = usersByRole[role] || usersByRole.customer || users;
      if (!pool || pool.length === 0) continue;

      const user = pool[i % pool.length];
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
      updated += 1;
    }

    console.log(`  ✓ Backfilled userId on ${updated} notification settings`);
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

    console.log(`  ✓ Reverted ${docs.length} notification settings userIds`);
  }
};
