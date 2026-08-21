const mongoose = require("mongoose");
const { Schema } = mongoose;
const autopopulate = require("mongoose-autopopulate");
const DriverSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true,
      default: new mongoose.Types.ObjectId()
    },
    currentOrder: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    licenseNumber: { type: String, required: true, unique: true, default: "" },
    users: { type: Object, default: { value: "", label: "" } },
    vehicle: {
      type: Object,
      default: {
        type: "",
        model: "",
        licensePlate: ""
      }
    },
    location: {
      type: { type: String, default: "Point",
        enum: ["Point"],
        required: true
      },
      coordinates: { type: [Number], default: [0, 0], required: true }
    },
    status: {
      type: String,
      default: "offline"
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalDeliveries: { type: Number, default: 0 },
    documents: [
    {
      type: { type: String, required: true },
      fileUrl: { type: String, required: true }
    }],

    isApproved: { type: Boolean, default: false }
  },
  { id: false, timestamps: true }
);
DriverSchema.virtual("image").get(function () {
  return this.userId?.image || "";
});
DriverSchema.set("toJSON", { virtuals: true });
DriverSchema.set("toObject", { virtuals: true });

const USER_ID_POPULATE = {
  path: "userId",
  select: "name email phone image value label"
};

const ONLINE_STATUSES = ["available", "busy", "on_delivery"];

function transformUsersField(doc) {
  if (!doc?.users?.value) return;
  doc.userId = doc.users.value;
  doc.users = {
    value: doc.users.value,
    label: doc.users.label
  };
  doc.updatedAt = Date.now();
}
DriverSchema.pre("save", function (next) {
  transformUsersField(this);
  next();
});
DriverSchema.pre("findOneAndUpdate", async function () {
  this.populate(USER_ID_POPULATE);
  const update = this.getUpdate();
  if (update?.users) {
    transformUsersField(update);
  }

  const nextStatus = update?.status ?? update?.$set?.status;
  if (!nextStatus || nextStatus === "offline" || !ONLINE_STATUSES.includes(nextStatus)) {
    return;
  }

  const doc = await this.model.findOne(this.getQuery()).select("isApproved").lean();
  if (doc && !doc.isApproved) {
    throw new Error("driver_not_approved");
  }
});
DriverSchema.post("findOneAndUpdate", async function (doc) {
  if (!doc) return;
  try {
    const { emitDriverLocationToActiveOrders } = require("../services/logisticsService");
    await emitDriverLocationToActiveOrders(doc);
  } catch (error) {
    if (doc.currentOrder && global.io) {
      global.io.to(`order-${doc.currentOrder}`).emit("driver-location-updated", {
        location: doc.location
      });
    }
  }
});
DriverSchema.pre("findOne", function () {
  this.populate(USER_ID_POPULATE);
});
DriverSchema.post("findOne", function (doc) {
});
DriverSchema.pre("find", function () {
  this.populate(USER_ID_POPULATE);
});
DriverSchema.pre("validate", function (next) {
  next();
});
const Driver = mongoose.model("Driver", DriverSchema);
module.exports = Driver;
