
const { ObjectId } = require('mongodb');

const DEMO_USER_ID = new ObjectId('6979f426af5473434a8de666');
const DEMO_DRIVER_ID = new ObjectId('6979f43d81158605b78de666');
const SEED_KEY = 'migration_23_demo_driver_notifications';

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function daysAgo(days, extraHours = 0) {
  return new Date(Date.now() - (days * 24 + extraHours) * 60 * 60 * 1000);
}

function buildSeedNotifications(orders = []) {
  const [order1, order2, order3] = orders;
  const orderRef = (order) => String(order?._id || '').slice(-6).toUpperCase();

  const notifications = [
  {
    title: 'New delivery available',
    message: order1 ?
    `Order #${orderRef(order1)} is ready for pickup nearby.` :
    'A new delivery is available in your area.',
    type: 'order',
    isRead: false,
    priority: 'high',
    createdAt: hoursAgo(0.5),
    action: 'view_order',
    actionData: order1 ?
    { orderId: String(order1._id), seedKey: SEED_KEY } :
    { seedKey: SEED_KEY }
  },
  {
    title: 'Order update',
    message: order1 ?
    `Order #${orderRef(order1)} has been marked as delivered.` :
    'Your latest delivery was completed successfully.',
    type: 'delivery_update',
    relatedEntity: order1?._id,
    relatedEntityModel: 'Order',
    isRead: false,
    priority: 'high',
    createdAt: hoursAgo(2),
    action: 'view_order',
    actionData: order1 ?
    { orderId: String(order1._id), seedKey: SEED_KEY } :
    { seedKey: SEED_KEY }
  },
  {
    title: 'Order status changed',
    message: order2 ?
    `Order #${orderRef(order2)} is ready at the restaurant.` :
    'An assigned order is ready for pickup.',
    type: 'order_status',
    relatedEntity: order2?._id,
    relatedEntityModel: 'Order',
    isRead: false,
    priority: 'medium',
    createdAt: hoursAgo(5),
    action: 'view_order',
    actionData: order2 ?
    { orderId: String(order2._id), seedKey: SEED_KEY } :
    { seedKey: SEED_KEY }
  },
  {
    title: 'Payment received',
    message: order2 ?
    `Earnings for order #${orderRef(order2)} have been credited.` :
    'Your latest delivery earnings have been credited.',
    type: 'payment',
    relatedEntity: order2?._id,
    relatedEntityModel: 'Order',
    isRead: true,
    priority: 'medium',
    createdAt: daysAgo(1, 3),
    actionData: order2 ?
    { orderId: String(order2._id), seedKey: SEED_KEY } :
    { seedKey: SEED_KEY }
  },
  {
    title: 'Weekend bonus',
    message: 'Complete 3 more deliveries this weekend to unlock a €15 bonus.',
    type: 'promotion',
    isRead: true,
    priority: 'low',
    createdAt: daysAgo(3),
    actionData: { seedKey: SEED_KEY }
  },
  {
    title: 'System update',
    message: 'Good Food Driver app v2.1 is available with improved navigation.',
    type: 'system',
    isRead: true,
    priority: 'low',
    createdAt: daysAgo(5),
    actionData: { seedKey: SEED_KEY }
  },
  {
    title: 'Delivery completed',
    message: order3 ?
    `Order #${orderRef(order3)} was delivered successfully.` :
    'One of your recent deliveries was completed.',
    type: 'delivery_update',
    relatedEntity: order3?._id,
    relatedEntityModel: 'Order',
    isRead: true,
    priority: 'medium',
    createdAt: daysAgo(7, 2),
    action: 'view_order',
    actionData: order3 ?
    { orderId: String(order3._id), seedKey: SEED_KEY } :
    { seedKey: SEED_KEY }
  }];

  return notifications.
  filter((notification) => {
    if (['order_status', 'delivery_update', 'payment'].includes(notification.type)) {
      return Boolean(notification.relatedEntity);
    }
    return true;
  }).
  map((notification) => ({
    user: DEMO_USER_ID,
    createdBy: 'system',
    updatedAt: notification.createdAt,
    ...notification
  }));
}

async function up(db) {
  const notificationsCol = db.collection('notifications');
  const usersCol = db.collection('users');
  const ordersCol = db.collection('orders');

  const alreadySeeded = await notificationsCol.countDocuments({
    'actionData.seedKey': SEED_KEY
  });

  if (alreadySeeded > 0) {
    console.log('✅ Notifications déjà seedées pour le driver démo');
    return;
  }

  const demoUser = await usersCol.findOne({ _id: DEMO_USER_ID });
  if (!demoUser) {
    console.log('⚠️ User démo introuvable — migration ignorée');
    return;
  }

  const orders = await ordersCol.
  find({
    driver: DEMO_DRIVER_ID,
    status: { $in: ['delivered', 'out_for_delivery', 'ready'] }
  }).
  sort({ createdAt: -1 }).
  limit(3).
  toArray();

  const notifications = buildSeedNotifications(orders);
  if (notifications.length === 0) {
    console.log('⚠️ Aucune notification générée pour le driver démo');
    return;
  }

  await notificationsCol.insertMany(notifications);
  console.log(`✅ ${notifications.length} notification(s) seedée(s) pour le driver démo`);
}

async function down(db) {
  const notificationsCol = db.collection('notifications');
  const result = await notificationsCol.deleteMany({ 'actionData.seedKey': SEED_KEY });
  console.log(`↩️ ${result.deletedCount} notification(s) supprimée(s)`);
}

module.exports = {
  DEMO_USER_ID,
  DEMO_DRIVER_ID,
  SEED_KEY,
  buildSeedNotifications,
  up,
  down
};
