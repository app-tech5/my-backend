
const SEED_KEY = 'migration_32_notifications_seed_demo';

const NOTIFICATION_TEMPLATES = [
{
  title: 'Your order is being prepared',
  message: 'The restaurant has started preparing your order. It will be ready shortly!',
  type: 'order_status',
  priority: 'high',
  createdBy: 'restaurant',
  relatedEntityModel: 'Order',
  minutesAgo: 15
},
{
  title: 'Driver on the way',
  message: 'Your delivery driver is heading to the restaurant to pick up your order.',
  type: 'delivery_update',
  priority: 'high',
  createdBy: 'system',
  relatedEntityModel: 'Order',
  minutesAgo: 10
},
{
  title: 'Order delivered!',
  message: 'Your order has been delivered. Enjoy your meal! Don\'t forget to rate your experience.',
  type: 'order_status',
  priority: 'medium',
  createdBy: 'system',
  relatedEntityModel: 'Order',
  minutesAgo: 5
},
{
  title: 'Flash sale — 20% off sushi',
  message: 'This weekend only: enjoy 20% off all sushi rolls at Sakura Sushi. Use code SUSHI20.',
  type: 'promotion',
  priority: 'medium',
  createdBy: 'admin',
  minutesAgo: 60 * 3
},
{
  title: 'New restaurant nearby',
  message: 'Trattoria Roma just joined Good Food! Authentic Italian cuisine is now a tap away.',
  type: 'new_restaurant',
  priority: 'low',
  createdBy: 'admin',
  minutesAgo: 60 * 24
},
{
  title: 'Payment received',
  message: 'We\'ve received your payment. Your receipt is available in the app.',
  type: 'payment',
  priority: 'medium',
  createdBy: 'system',
  relatedEntityModel: 'Payment',
  minutesAgo: 60 * 2
},
{
  title: 'Rate your last order',
  message: 'How was your experience with Le Petit Bistrot? Your feedback helps us improve.',
  type: 'review',
  priority: 'low',
  createdBy: 'system',
  minutesAgo: 60 * 6
},
{
  title: 'Welcome to Good Food!',
  message: 'Thanks for joining! Explore restaurants near you and place your first order today.',
  type: 'account',
  priority: 'low',
  createdBy: 'system',
  minutesAgo: 60 * 24 * 7
},
{
  title: 'Free delivery this weekend',
  message: 'Order from any restaurant this Saturday and Sunday and get free delivery!',
  type: 'promotion',
  priority: 'high',
  createdBy: 'admin',
  minutesAgo: 60 * 12
},
{
  title: 'Your account has been verified',
  message: 'Your email address has been verified. You can now enjoy all features of Good Food.',
  type: 'account',
  priority: 'low',
  createdBy: 'system',
  minutesAgo: 60 * 24 * 5
}];

module.exports = {
  async up(db) {
    const users = await db.
    collection('users').
    find({ role: 'customer' }).
    project({ _id: 1 }).
    toArray();

    if (users.length === 0) return;

    const orders = await db.
    collection('orders').
    find({}).
    project({ _id: 1, user: 1 }).
    toArray();

    const ordersByUser = {};
    for (const o of orders) {
      const uid = String(o.user);
      if (!ordersByUser[uid]) ordersByUser[uid] = [];
      ordersByUser[uid].push(o._id);
    }

    const now = Date.now();
    const docs = [];

    for (const u of users) {
      const uid = u._id;
      const userOrders = ordersByUser[String(uid)] || [];

      for (let i = 0; i < NOTIFICATION_TEMPLATES.length; i++) {
        const tpl = NOTIFICATION_TEMPLATES[i];
        const createdAt = new Date(now - tpl.minutesAgo * 60 * 1000);

        const notif = {
          user: uid,
          title: tpl.title,
          message: tpl.message,
          type: tpl.type,
          priority: tpl.priority,
          createdBy: tpl.createdBy,
          isRead: tpl.minutesAgo > 60 * 4,
          isActionRequired: false,
          createdAt,
          updatedAt: createdAt,
          migrationSeedKey: SEED_KEY
        };

        if (tpl.relatedEntityModel === 'Order' && userOrders.length > 0) {
          notif.relatedEntity = userOrders[i % userOrders.length];
          notif.relatedEntityModel = 'Order';
        } else if (tpl.relatedEntityModel === 'Payment' && userOrders.length > 0) {
          notif.relatedEntity = userOrders[0];
          notif.relatedEntityModel = 'Payment';
        }

        docs.push(notif);
      }
    }

    if (docs.length > 0) {
      await db.collection('notifications').insertMany(docs);
    }

    console.log(`  ✓ Seeded ${docs.length} notifications for ${users.length} customers`);
  },

  async down(db) {
    const result = await db.
    collection('notifications').
    deleteMany({ migrationSeedKey: SEED_KEY });
    console.log(`  ✓ Removed ${result.deletedCount} seeded notifications`);
  }
};
