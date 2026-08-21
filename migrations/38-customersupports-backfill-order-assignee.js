
const { ObjectId } = require('mongodb');

const SEED_KEY = 'migration_38_customersupport_order_assignee';

module.exports = {
  SEED_KEY,

  async up(db) {
    const supports = db.collection('customersupports');
    const users = db.collection('users');
    const orders = db.collection('orders');
    const backups = db.collection('_migration_38_customersupport_backups');

    const admins = await users.
    find({
      $or: [{ role: 'admin' }, { type: 'admin' }, { email: 'admin@example.com' }]
    }).
    project({ _id: 1, name: 1, email: 1 }).
    toArray();

    if (!admins.length) {
      console.log('[38] no admin users — skip');
      return;
    }

    const recentOrders = await orders.
    find({}).
    project({ _id: 1, user: 1, status: 1, restaurant: 1 }).
    sort({ createdAt: -1, created_at: -1 }).
    limit(200).
    toArray();

    if (!recentOrders.length) {
      console.log('[38] no orders — skip');
      return;
    }

    const ordersByUser = new Map();
    for (const order of recentOrders) {
      const uid = String(order.user || '');
      if (!uid) continue;
      if (!ordersByUser.has(uid)) ordersByUser.set(uid, []);
      ordersByUser.get(uid).push(order);
    }

    const tickets = await supports.
    find({
      type: { $in: ['ticket', 'live_chat'] },
      $or: [{ order: { $exists: false } }, { order: null }, { assigned_to: { $exists: false } }, { assigned_to: null }]
    }).
    toArray();

    let updated = 0;
    let adminIdx = 0;

    for (const doc of tickets) {
      const needsOrder = !doc.order;
      const needsAssignee = !doc.assigned_to;
      if (!needsOrder && !needsAssignee) continue;

      const patch = {};
      if (needsOrder) {
        const uid = String(doc.user || '');
        const userOrders = ordersByUser.get(uid) || [];
        const pick =
        userOrders[updated % Math.max(userOrders.length, 1)] ||
        recentOrders[updated % recentOrders.length];
        if (pick?._id) patch.order = pick._id;
      }
      if (needsAssignee) {
        patch.assigned_to = admins[adminIdx % admins.length]._id;
        adminIdx += 1;
      }

      if (!Object.keys(patch).length) continue;

      await backups.updateOne(
        { _id: doc._id },
        {
          $set: {
            _id: doc._id,
            before: {
              order: doc.order || null,
              assigned_to: doc.assigned_to || null
            },
            migrationSeedKey: SEED_KEY
          }
        },
        { upsert: true }
      );

      await supports.updateOne(
        { _id: doc._id },
        {
          $set: {
            ...patch,
            migrationSeedKey: SEED_KEY,
            updated_at: new Date()
          }
        }
      );
      updated += 1;
    }

    console.log(`[38] updated ${updated} customersupport docs (admins=${admins.length}, orders=${recentOrders.length})`);
  },

  async down(db) {
    const supports = db.collection('customersupports');
    const backups = db.collection('_migration_38_customersupport_backups');
    const docs = await backups.find({ migrationSeedKey: SEED_KEY }).toArray();

    for (const snap of docs) {
      const before = snap.before || {};
      const unset = {};
      const set = { updated_at: new Date() };
      if (before.order) set.order = before.order;else
      unset.order = '';
      if (before.assigned_to) set.assigned_to = before.assigned_to;else
      unset.assigned_to = '';

      const update = { $set: set, $unset: { migrationSeedKey: '' } };
      if (Object.keys(unset).length) update.$unset = { ...update.$unset, ...unset };

      await supports.updateOne({ _id: snap._id }, update);
    }

    await backups.deleteMany({ migrationSeedKey: SEED_KEY });
  }
};
