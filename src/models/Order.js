const mongoose = require("mongoose");
const autopopulate = require('mongoose-autopopulate');
const Driver = require("./Driver");
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId, ref: "User", required: true,
      autopopulate: {
        select: "name phone image address"
      }
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true,
      autopopulate: {
        select: "name phone image address"
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
      enum: ["pending", "preparing", "out_for_delivery", "delivered", "cancelled"],
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
  order.items = order.items.map(item => {
    const itemId = item.item?._id || item.item;
    const extrasWithoutId = item.toObject().extras.map(extra => {
      const { _id, ...rest } = extra;
      return rest;
    });
    const updatedItem = {
      name: item.item?.name || "",
      image: item.item?.image || "",
      price: (item.item?.price) || 0,
      quantity: item.quantity,
      extras: item.toObject().extras.map(({ productId, ...rest }) => rest),
      variants: item.variants,
      total: item.quantity * item.item?.price + item.extras.reduce((a, v) => a + v.price * v.quantity, 0)
    };
    return updatedItem;
  });
  order.subtotal = order.items.reduce((a, v) => a + v.total, 0);
  order.tax.amount = order.tax.rate * order.subtotal;
  order.totalPrice = order.items.reduce((a, v) => a + v.total, 0) + order.delivery.deliveryFee + order.tax.amount;
});
orderSchema.pre('findOneAndUpdate', async function (next) {
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
  const driver = await Driver.findOne({ _id: doc.driver._id });
  // const driverId = String(doc.driver._id);
  io.to(`orders-${driver.userId.id}`).emit('order-updated', {
    order: doc,
  });
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
    this.where({ restaurant: this.options.authUser.restaurant });
  }
  next();
});
module.exports = mongoose.model("Order", orderSchema);
