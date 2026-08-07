/**
 * Seed Kitchen Display tickets for demo restaurant (demo@restaurant.com).
 * Creates fresh pending / preparing / ready orders so KDS is not empty.
 *
 * up   → insert KDS demo orders (idempotent via migrationSeedKey)
 * down → delete those seeded orders
 */

const { ObjectId } = require('mongodb');

const SEED_KEY = 'migration_41_kds_demo_tickets';
const DEMO_EMAIL = 'demo@restaurant.com';

const TICKETS = [
  {
    status: 'pending',
    minutesAgo: 3,
    items: [
      { name: 'Pizza Margherita', price: 14.5, quantity: 1 },
      { name: 'Coca-Cola', price: 3.5, quantity: 2 },
    ],
  },
  {
    status: 'pending',
    minutesAgo: 8,
    items: [
      { name: 'Burger Deluxe', price: 16.9, quantity: 1 },
      { name: 'Frites', price: 4.5, quantity: 1 },
    ],
  },
  {
    status: 'pending',
    minutesAgo: 12,
    items: [{ name: 'Poke Bowl', price: 15.5, quantity: 2 }],
  },
  {
    status: 'accepted',
    minutesAgo: 6,
    items: [
      { name: 'Pâtes Carbonara', price: 13.9, quantity: 1 },
      { name: 'Tiramisu', price: 6.5, quantity: 1 },
    ],
  },
  {
    status: 'preparing',
    minutesAgo: 11,
    items: [
      { name: 'Salade César', price: 12.5, quantity: 1 },
      { name: 'Soupe du jour', price: 7.9, quantity: 1 },
    ],
  },
  {
    status: 'preparing',
    minutesAgo: 18,
    items: [
      { name: 'Sushi Mix', price: 22.0, quantity: 1 },
      { name: 'Miso Soup', price: 4.5, quantity: 1 },
      { name: 'Edamame', price: 5.0, quantity: 1 },
    ],
  },
  {
    status: 'ready',
    minutesAgo: 4,
    items: [{ name: 'Tacos Mexicains', price: 11.5, quantity: 2 }],
  },
  {
    status: 'ready',
    minutesAgo: 9,
    items: [
      { name: 'Poulet rôti', price: 18.5, quantity: 1 },
      { name: 'Gratin dauphinois', price: 6.0, quantity: 1 },
    ],
  },
  {
    status: 'ready',
    minutesAgo: 14,
    items: [
      { name: 'Ramen Tonkotsu', price: 16.0, quantity: 1 },
      { name: 'Gyoza', price: 7.5, quantity: 1 },
    ],
  },
];

function buildItems(rawItems) {
  return rawItems.map((item, index) => {
    const quantity = item.quantity || 1;
    const price = item.price;
    const total = Number((price * quantity).toFixed(2));
    return {
      type: 'Product',
      item: `kds-seed-item-${index}`,
      name: item.name,
      image: '',
      price,
      currency: 'EUR',
      quantity,
      extras: [],
      variants: [],
      total,
    };
  });
}

function totalsFromItems(items) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const taxAmount = Number((subtotal * 0.1).toFixed(2));
  const deliveryFee = 4.5;
  const totalPrice = Number((subtotal + taxAmount + deliveryFee).toFixed(2));
  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax: { rate: 0.1, amount: taxAmount },
    deliveryFee,
    totalPrice,
  };
}

async function up(db) {
  const usersCol = db.collection('users');
  const ordersCol = db.collection('orders');
  const now = new Date();

  const existing = await ordersCol.countDocuments({ migrationSeedKey: SEED_KEY });
  if (existing > 0) {
    console.log(`✅ KDS tickets déjà seedés (${existing})`);
    return;
  }

  const demoUser = await usersCol.findOne({ email: DEMO_EMAIL, role: 'restaurant' });
  if (!demoUser?.restaurant) {
    console.log('⚠️ Compte demo restaurant introuvable — migration 41 ignorée');
    return;
  }

  const restaurantId = demoUser.restaurant;
  const customers = await usersCol
    .find({ role: 'customer' })
    .project({ _id: 1, name: 1, phone: 1 })
    .limit(20)
    .toArray();

  if (!customers.length) {
    console.log('⚠️ Aucun customer pour rattacher les tickets KDS — migration 41 ignorée');
    return;
  }

  const docs = TICKETS.map((ticket, index) => {
    const items = buildItems(ticket.items);
    const money = totalsFromItems(items);
    const createdAt = new Date(now.getTime() - ticket.minutesAgo * 60 * 1000);
    const customer = customers[index % customers.length];

    return {
      user: customer._id,
      customerName: customer.name || `Guest ${index + 1}`,
      customerPhone: customer.phone || '06 00 00 00 00',
      restaurant: restaurantId,
      driver: null,
      items,
      totalPrice: money.totalPrice,
      subtotal: money.subtotal,
      tax: money.tax,
      status: ticket.status,
      payment: {
        method: 'card',
        status: 'paid',
        transactionId: `kds-seed-${index + 1}`,
      },
      delivery: {
        type: index % 2 === 0 ? 'delivery' : 'pickup',
        address: '12 Rue Ramey, 75018 Paris',
        estimatedTime: new Date(createdAt.getTime() + 35 * 60 * 1000),
        deliveryFee: money.deliveryFee,
      },
      createdAt,
      updatedAt: now,
      migrationSeedKey: SEED_KEY,
    };
  });

  await ordersCol.insertMany(docs);
  console.log(`✅ ${docs.length} ticket(s) KDS seedé(s) pour ${DEMO_EMAIL}`);
}

async function down(db) {
  const result = await db.collection('orders').deleteMany({ migrationSeedKey: SEED_KEY });
  console.log(`↩️ Migration 41 annulée (${result.deletedCount} commande(s) supprimée(s))`);
}

module.exports = { up, down };
