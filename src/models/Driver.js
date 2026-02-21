const mongoose = require("mongoose");
const { Schema } = mongoose;
const autopopulate = require("mongoose-autopopulate");
const DriverSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true,
        default: new mongoose.Types.ObjectId()
     }, 
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
        coordinates: { type: [Number], default: [0, 0], required: true }, 
      },
    status: {
      type: String,
      default: "offline",
    }, 
    rating: { type: Number, default: 0, min: 0, max: 5 }, 
    totalDeliveries: { type: Number, default: 0 }, 
    documents: [
      {
        type: { type: String, required: true }, 
        fileUrl: { type: String, required: true }, 
      },
    ],
    isApproved: { type: Boolean, default: false }, 
  },
  { id: false, timestamps: true }
);
function transformUsersField(doc) {
  doc.userId = doc.users.value;
  doc.users = {
    value: doc.users.value,
    label: doc.users.label,
  };
  doc.updatedAt = Date.now();
}
DriverSchema.pre("save", function (next) {
  transformUsersField(this);
  next();
});
DriverSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    console.log(update)
    transformUsersField(update);
    next();
  });
DriverSchema.pre("findOne", function () {
  this.populate({
    path: "userId",
    select: "name email phone image value label", 
  });
});
DriverSchema.post("findOne", function (doc) {
});
DriverSchema.pre("validate", function (next) {
  console.log("this.users.value", this)
  next();
});
const Driver = mongoose.model("Driver", DriverSchema);
module.exports = Driver;
