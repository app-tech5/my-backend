/**
 * Rebase les dates des commandes seed migration 29 (histogramme admin).
 * L'ancien schéma utilisait les jours 3/7/11/15/19/23 — le jour 23 de juillet
 * polluait le compteur "Today's orders" du dashboard restaurant.
 *
 * Nouveau schéma : jours 3/6/9/12/15/18 (toujours Jan–Jul 2026).
 *
 * up   → réécrit createdAt/updatedAt des seeds migration_29 (idempotent)
 * down → restaure les dates sauvegardées par cette migration
 */

const SEED_KEY = 'migration_30_orders_rebase_admin_histogram_days';
const SOURCE_SEED_KEY = 'migration_29_admin_dashboard_histogram';
const MARKETING_YEAR = 2026;
const DAYS_PER_MONTH = [3, 6, 9, 12, 15, 18];

function monthDate(year, monthIndex, day) {
  return new Date(year, monthIndex, day, 12, 30, 0, 0);
}

async function up(db) {
  const ordersCol = db.collection('orders');

  const seeded = await ordersCol
    .find({ migrationSeedKey: SOURCE_SEED_KEY })
    .sort({ createdAt: 1, _id: 1 })
    .toArray();

  if (!seeded.length) {
    console.log('⚠️ Aucune commande migration_29 — migration 30 ignorée');
    return;
  }

  const byMonth = new Map();
  for (const order of seeded) {
    const month = order.createdAt instanceof Date
      ? order.createdAt.getMonth()
      : new Date(order.createdAt).getMonth();
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month).push(order);
  }

  let updated = 0;
  let skipped = 0;

  for (const [monthIndex, monthOrders] of byMonth) {
    const sorted = [...monthOrders].sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const dbTime = new Date(b.createdAt).getTime();
      if (da !== dbTime) return da - dbTime;
      return String(a._id).localeCompare(String(b._id));
    });

    for (let slot = 0; slot < sorted.length; slot += 1) {
      const order = sorted[slot];
      const day = DAYS_PER_MONTH[Math.min(slot, DAYS_PER_MONTH.length - 1)];
      const nextCreatedAt = monthDate(MARKETING_YEAR, monthIndex, day);

      if (order.migration30SeedKey === SEED_KEY) {
        const alreadyCorrect =
          order.createdAt instanceof Date &&
          order.createdAt.getTime() === nextCreatedAt.getTime();
        if (alreadyCorrect) {
          skipped += 1;
          continue;
        }
      }

      await ordersCol.updateOne(
        { _id: order._id },
        {
          $set: {
            createdAt: nextCreatedAt,
            updatedAt: nextCreatedAt,
            migration30SeedKey: SEED_KEY,
            migration30PreviousCreatedAt:
              order.migration30PreviousCreatedAt ?? order.createdAt,
            migration30PreviousUpdatedAt:
              order.migration30PreviousUpdatedAt ?? order.updatedAt,
          },
        }
      );

      updated += 1;
    }
  }

  console.log(
    `✅ Migration 30 : ${updated} date(s) rebase(s), ${skipped} déjà à jour (${seeded.length} seed migration_29)`
  );
}

async function down(db) {
  const ordersCol = db.collection('orders');
  const touched = await ordersCol.find({ migration30SeedKey: SEED_KEY }).toArray();

  for (const order of touched) {
    const $set = {};
    if (order.migration30PreviousCreatedAt) {
      $set.createdAt = order.migration30PreviousCreatedAt;
    }
    if (order.migration30PreviousUpdatedAt) {
      $set.updatedAt = order.migration30PreviousUpdatedAt;
    }

    await ordersCol.updateOne(
      { _id: order._id },
      {
        $set,
        $unset: {
          migration30SeedKey: '',
          migration30PreviousCreatedAt: '',
          migration30PreviousUpdatedAt: '',
        },
      }
    );
  }

  console.log(`↩️ Migration 30 : ${touched.length} commande(s) restaurée(s)`);
}

module.exports = {
  SEED_KEY,
  SOURCE_SEED_KEY,
  MARKETING_YEAR,
  DAYS_PER_MONTH,
  monthDate,
  up,
  down,
};
