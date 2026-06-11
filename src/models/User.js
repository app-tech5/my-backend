const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const convertToModelName = require("../utils/convertToModelName");
const i18n = require("../config/i18n");

const PROFILE_FIELDS = ['name', 'phone', 'address', 'image', 'location'];

const isProfileUpdatePayload = (update = {}) => {
  if (PROFILE_FIELDS.some((field) => update[field] != null)) return true;
  if (update.$set && PROFILE_FIELDS.some((field) => update.$set[field] != null)) return true;
  return false;
};

const createDemoProfileUpdateError = () => {
  const err = new Error(i18n.__('demo_mode_action_not_available'));
  err.statusCode = 403;
  return err;
};
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, default: "" },
    password: {
      type: String, required: true,
      default: ''
    },
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    image: { type: String, default: '' },
    address: {
      type: String, default: '',
      required: function () {
        return this.role === 'customer';
      }
    },
    location: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    role: {
      type: String,
      enum: ['customer', 'restaurant', 'delivery', 'admin'],
      default: 'customer'
    },
    favorites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant'
    }],
    orders: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }],
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant'
    },
    deliveryZones: [{ type: String }],
    isActive: { type: Boolean, default: true },
    paymentMethods: [{
      type: { type: String, enum: ['card', 'paypal', 'cash'] },
      details: mongoose.Schema.Types.Mixed
    }],
    ratings: {
      asCustomer: { type: Number },
      asRestaurant: { type: Number },
      asDelivery: { type: Number }
    },
    stripeCustomerId: { type: String, default: '' },
    deviceToken: { type: String, default: '' },
    isDemo: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
UserSchema.virtual("value").get(function () {
  return this._id;
});
UserSchema.virtual("label").get(function () {
  return this.email;
});
UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });
UserSchema.pre("find", async function (next) {
  const queryParams = this.options.queryParams;
  if (queryParams && Object.keys(queryParams).length > 0) {
    const Model = mongoose.model(convertToModelName(queryParams.type));
    const items = await Model.find({}, "userId").lean();
    const itemUserIds = items.map((item) => item.userId);
    this.where({ _id: { $nin: itemUserIds } });
  }
  next();
});
UserSchema.pre("save", async function (next) {
  if (
    process.env.DEMO_MODE === 'true' &&
    PROFILE_FIELDS.some((field) => this.isModified(field))
  ) {
    return next(createDemoProfileUpdateError());
  }
  if (this.isModified("password") && this.password) this.password = await bcrypt.hash(this.password, 10);
  next();
});
UserSchema.pre("findOneAndUpdate", async function (next) {
  if (process.env.DEMO_MODE === 'true' && isProfileUpdatePayload(this.getUpdate())) {
    return next(createDemoProfileUpdateError());
  }
  this.previousUser = await this.model.findOne(this.getQuery());
  if (this.getUpdate()?.password) this.getUpdate().password = await bcrypt.hash(this.getUpdate().password, 10);
  next();
});
UserSchema.post("findOneAndUpdate", async function (doc) {
  const io = global.io;
  if (!io || !doc) return;
  if (doc.isActive === false && this.previousUser?.isActive !== false) {
    io.to(`user-${doc._id}`).emit("user-disabled");
  }
});
module.exports = mongoose.model("User", UserSchema);
