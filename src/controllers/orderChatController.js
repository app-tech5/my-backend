const Order = require('../models/Order');
const Driver = require('../models/Driver');
const OrderChatMessage = require('../models/OrderChatMessage');
const i18n = require('../config/i18n');

async function assertOrderChatAccess(req, order) {
  if (!order) {
    const err = new Error(i18n.__('order_not_found') || 'Order not found');
    err.status = 404;
    throw err;
  }

  const userId = String(req.user.id);
  const role = req.user.type;

  if (role === 'admin') return { role: 'admin' };

  if (role === 'customer' || !role) {
    const orderUserId = String(order.user?._id || order.user);
    if (orderUserId === userId) return { role: 'customer' };
  }

  if (role === 'delivery' || role === 'driver') {
    const driver = await Driver.findOne({ userId: req.user.id }).select('_id');
    if (driver && order.driver && String(order.driver._id || order.driver) === String(driver._id)) {
      return { role: 'driver' };
    }
  }

  if (role === 'restaurant') {
    const restaurantId = String(order.restaurant?._id || order.restaurant);
    const userRestaurant = String(req.user.restaurant || '');
    if (userRestaurant && userRestaurant === restaurantId) {
      return { role: 'restaurant' };
    }
  }

  const err = new Error(i18n.__('access_denied') || 'Access denied');
  err.status = 403;
  throw err;
}

function serializeMessage(msg) {
  return {
    id: String(msg._id),
    order: String(msg.order),
    sender: String(msg.sender?._id || msg.sender),
    senderName: msg.sender?.name || null,
    senderRole: msg.senderRole,
    text: msg.text,
    createdAt: msg.createdAt
  };
}

exports.getMessages = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).select('user restaurant driver status');
    await assertOrderChatAccess(req, order);

    const messages = await OrderChatMessage.find({ order: order._id }).
    sort({ createdAt: 1 }).
    limit(200).
    populate('sender', 'name');

    res.json({
      orderId: String(order._id),
      status: order.status,
      messages: messages.map(serializeMessage)
    });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || i18n.__('server_error')
    });
  }
};

exports.postMessage = async (req, res) => {
  try {
    const text = String(req.body?.text || '').trim();
    if (!text) {
      return res.status(400).json({ message: 'Message text is required' });
    }
    if (text.length > 2000) {
      return res.status(400).json({ message: 'Message is too long' });
    }

    const order = await Order.findById(req.params.orderId).select('user restaurant driver status');
    const access = await assertOrderChatAccess(req, order);

    if (['delivered', 'cancelled'].includes(order.status) && access.role !== 'admin') {

    }

    const saved = await OrderChatMessage.create({
      order: order._id,
      sender: req.user.id,
      senderRole: access.role,
      text
    });

    await saved.populate('sender', 'name');
    const payload = serializeMessage(saved);

    if (global.io) {
      global.io.to(`order-chat-${order._id}`).emit('order-chat-message', payload);

      const customerId = String(order.user?._id || order.user);
      global.io.to(`user-${customerId}`).emit('order-chat-message', payload);
      if (order.driver) {
        const driverDoc = await Driver.findById(order.driver._id || order.driver).select('userId');
        if (driverDoc?.userId) {
          global.io.to(`user-${driverDoc.userId}`).emit('order-chat-message', payload);
        }
      }
    }

    res.status(201).json(payload);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || i18n.__('server_error')
    });
  }
};
