const mongoose = require("mongoose");
const autopopulate = require('mongoose-autopopulate');
const Driver = require("./Driver");
const i18n = require("../config/i18n");
const { notifyResource } = require("../services/notifyResource");
const Restaurant = require("./Restaurant");
const { resolveRestaurantIdForAuthUser } = require("../utils/resolveRestaurantIdForAuthUser");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId, ref: "User", required: true,
      autopopulate: {
        select: "name phone image address location"
      }
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true,
      autopopulate: {
        select: "name phone image address isActivated latitude longitude"
      }
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId, ref: "Driver",
      autopopulate: {
        select: "userId vehicle location"
      }
    },
    items: [
      {
        type: { type: String, required: true },
        item: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "items.type" },
        name: { type: String, required: true },
        image: { type: String, required: true },
        price: { type: String, required: true },
        currency: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        extras: [
          {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true }
          }
        ],
        variants: [
          {
            name: { type: String },
            price: { type: Number },
            extra: { type: Number },
            size: { type: String },
          }
        ],
        total: { type: Number, required: true }
      },
    ],
    totalPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    tax: {
      rate: { type: Number, required: true },
      amount: { type: Number },
    },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"],
      default: "pending"
    },
    payment: {
      method: {
        type: String,
        enum: [
          "credit_card",
          "mobile_money",
          "cash_on_delivery",
          "paypal",
          "google_pay",
          "apple_pay",
          "paystack",
          "flutterwave",
          "razorpay",
          "wallet",
          "crypto",
        ],
        required: true,
      },
      status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
      transactionId: { type: String },
      provider: { type: String },
    },
    orderSource: {
      type: String,
      enum: ["app", "whatsapp", "ussd", "web", "admin"],
      default: "app",
    },
    channelMeta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    delivery: {
      type: {
        type: String,
        enum: ["delivery", "pickup"],
        required: true
      },
      address: { type: String },
      estimatedTime: { type: Date },
      deliveryFee: { type: Number },
      proofOfDelivery: {
        photoUrl: { type: String },
        signatureData: { type: String },
        contactless: { type: Boolean, default: false },
        completedAt: { type: Date },
        completedLocation: {
          type: { type: String, enum: ["Point"], default: "Point" },
          coordinates: { type: [Number] },
        },
        geofenceMeters: { type: Number },
        distanceMeters: { type: Number },
        geofenceOk: { type: Boolean },
      },
    },
    batchId: { type: String, index: true },
  },
  { timestamps: true }
);
orderSchema.plugin(autopopulate);
orderSchema.pre("findOne", function () {
  this.populate({
    path: "items.item",
    select: "name image price"
  }).populate({
    path: "driver",
    select: "userId vehicle location",
    populate: {
      path: "userId",
      model: "User",
      select: "name phone image"
    }
  });
});
orderSchema.post('findOne', function (order) {
  if (!order) {
    return;
  }
  if (!Array.isArray(order.items)) {
    return;
  }
  const previousSubtotal = order.subtotal;
  const previousTaxAmount = order.tax?.amount;
  const previousTotal = order.totalPrice;

  order.items = order.items.map((item) => {
    const raw = typeof item.toObject === "function" ? item.toObject() : item;
    const populated =
      raw.item && typeof raw.item === "object" && raw.item.name != null
        ? raw.item
        : null;
    const extras = Array.isArray(raw.extras) ? raw.extras : [];
    const extrasTotal = extras.reduce(
      (sum, extra) => sum + Number(extra.price || 0) * Number(extra.quantity || 1),
      0
    );
    const quantity = Number(raw.quantity || 1);
    const unitPrice = Number(
      populated?.price ?? raw.price ?? 0
    );
    const computedTotal = quantity * unitPrice + extrasTotal;
    const snapshotTotal = Number(raw.total);
    const total =
      Number.isFinite(computedTotal) && computedTotal > 0
        ? computedTotal
        : Number.isFinite(snapshotTotal)
          ? snapshotTotal
          : 0;

    return {
      name: populated?.name || raw.name || "Item",
      image: populated?.image || raw.image || "",
      price: unitPrice || (quantity ? total / quantity : 0),
      quantity,
      extras: extras.map(({ productId, _id, ...rest }) => rest),
      variants: raw.variants || [],
      total,
    };
  });

  const itemsSubtotal = order.items.reduce((sum, row) => sum + Number(row.total || 0), 0);
  if (itemsSubtotal > 0) {
    order.subtotal = itemsSubtotal;
    if (order.tax) {
      order.tax.amount = Number(order.tax.rate || 0) * itemsSubtotal;
    }
    order.totalPrice =
      itemsSubtotal +
      Number(order.delivery?.deliveryFee || 0) +
      Number(order.tax?.amount || 0);
  } else {
    // Keep persisted totals when line items could not be priced from catalog
    if (previousSubtotal != null) order.subtotal = previousSubtotal;
    if (order.tax && previousTaxAmount != null) order.tax.amount = previousTaxAmount;
    if (previousTotal != null) order.totalPrice = previousTotal;
  }
});
const getNextStatusFromUpdate = (update = {}) => {
  if (update.status != null) return update.status;
  if (update.$set?.status != null) return update.$set.status;
  return null;
};

orderSchema.pre('findOneAndUpdate', async function (next) {
  const nextStatus = getNextStatusFromUpdate(this.getUpdate());
  if (process.env.DEMO_MODE === 'true' && nextStatus === 'cancelled') {
    const err = new Error(i18n.__('demo_mode_action_not_available'));
    err.statusCode = 403;
    return next(err);
  }

  this.previousOrder = await this.model.findOne(this.getQuery());
  if (this.options.authUser?.type === 'delivery') {

    try {
      if (!this.previousOrder.driver) {
        const driver = await Driver.findOne({ userId: this.options.authUser.id });
        this.getUpdate().driver = driver._id;
      }
    } catch (error) {
      console.error('Error finding driver:', error);
    }
  }
  next();
});
orderSchema.post('findOneAndUpdate', async function (doc) {

  const io = global.io;
  if (!io || !doc) return;

  try {
    const userId = doc.user?.id || doc.user?._id || doc.user;
    if (userId) {
      io.to(`orders-${userId}`).emit('order-updated', {
        order: doc,
      });
    }
    if (doc.driver) {
      const driver = await Driver.findOne({ _id: doc.driver._id || doc.driver });
      if (driver?.userId) {
        const driverUserId = driver.userId.id || driver.userId._id || driver.userId;
        io.to(`orders-${driverUserId}`).emit('order-updated', {
          order: doc,
        });
      }
    }
  } catch (e) {
    console.error('order socket emit error', e.message);
  }

  try {
    const AppSetting = require('./AppSetting');
    const { refundOrderToWallet, applyOrderCashback } = require('../services/walletLedgerService');
    const { notifyOrderViaChannels } = require('../services/channelService');
    const settings = await AppSetting.findOne().lean();

    if (doc.status === 'cancelled' && settings?.walletInstantRefundEnabled !== false) {
      await refundOrderToWallet(doc, { reason: 'order_cancelled' });
    }
    if (doc.status === 'delivered') {
      await applyOrderCashback(doc);
    }

    if (settings?.whatsappNotifyOnStatus !== false) {
      await notifyOrderViaChannels(doc, {
        title: `Order ${String(doc._id).slice(-6)}`,
        message: `Status: ${doc.status}`,
      });
    }
  } catch (e) {
    console.error('order post-update side effects', e.message);
  }
});
orderSchema.post('save', async function (doc) {
  try {
    if (doc.restaurant.isActivated) {
      const restaurantId = doc.restaurant?._id ?? doc.restaurant;
      const orderId = String(doc._id);
      await notifyResource({
        userFilter: { restaurant: restaurantId, role: 'restaurant' },
        titleKey: 'new_order_received_title',
        messageKey: 'new_order_received_message',
        messageArgs: [orderId],
        type: 'order',
        relatedEntity: doc._id,
        relatedEntityModel: 'Order',
        action: 'view_order',
        actionData: { orderId },
        pushData: { type: 'order', orderId },
      });
    }
  } catch (error) {
    console.error(i18n.__('new_order_notification_creation_error'), error);
  }
});
orderSchema.pre('find', async function (next) {
  if (this.options.authUser?.type === 'customer') {
    this.where({ user: this.options.authUser.id });
  }
  if (this.options.authUser?.type === 'delivery') {
    const driver = await Driver.findOne({ userId: this.options.authUser.id });
    const { getActiveBenefits } = require('../services/subscriptionService');
    const { LIMITS } = require('../constants/logistics');
    const benefits = await getActiveBenefits(this.options.authUser.id, 'driver');
    const hasPriority = !!(benefits?.active && benefits?.prioritySupport);

    if (hasPriority) {
      // Priority members see new pending jobs immediately (+ their assigned ones)
      this.where({
        $or: [
          { driver: driver?._id },
          { status: 'pending' },
          { status: 'ready', driver: null },
        ],
      });
    } else {
      // Others wait a short lead window so priority drivers get first look
      const leadMs = (LIMITS.PRIORITY_JOB_LEAD_SECONDS || 90) * 1000;
      const cutoff = new Date(Date.now() - leadMs);
      this.where({
        $or: [
          { driver: driver?._id },
          { status: 'pending', createdAt: { $lte: cutoff } },
          { status: 'ready', driver: null },
        ],
      });
    }
  }
  if (this.options.authUser?.type === 'restaurant') {
    const restaurantId = await resolveRestaurantIdForAuthUser(this.options.authUser);
    if (restaurantId) {
      this.where({ restaurant: restaurantId });
    } else {
      this.where({ _id: null });
    }
  }
  next();
});
module.exports = mongoose.model("Order", orderSchema);
