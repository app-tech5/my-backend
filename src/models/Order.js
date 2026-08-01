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
      method: { type: String, enum: ["credit_card", "mobile_money", "cash_on_delivery", "paypal", "google_pay", "apple_pay"], required: true },
      status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
      transactionId: { type: String }
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
    }
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
  if (!io) return;

  io.to(`orders-${doc.user.id}`).emit('order-updated', {
    order: doc,
  });
  if (doc.driver) {
    const driver = await Driver.findOne({ _id: doc.driver._id });
    // const driverId = String(doc.driver._id);
    io.to(`orders-${driver.userId.id}`).emit('order-updated', {
      order: doc,
    });
  }
  if (doc.status === 'cancelled') {
    // await notifyResource({ userFilter: { restaurant: doc.restaurant?._id ?? doc.restaurant, role: 'restaurant' }, titleKey: 'order_cancelled_title', messageKey: 'order_cancelled_message', messageArgs: [String(doc._id)], type: 'order_status', relatedEntity: doc._id, relatedEntityModel: 'Order', action: 'view_order', actionData: { orderId: String(doc._id) }, pushData: { type: 'order_cancelled', orderId: String(doc._id) } });
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
    //this.where({ driver:  driver._id });
    this.where({ $or: [{ driver: driver?._id }, { status: "pending" }] });
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
