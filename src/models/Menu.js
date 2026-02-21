const mongoose = require("mongoose");
const applyTransformHooks = require("../utils/applyTransformHooks");
const MenuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: ""
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    price: {
      type: Number,
      required: true,
      default: 0
    },
    image: {
      type: String,
      required: true,
      default: ""
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      default: new mongoose.Types.ObjectId()
    },
    restaurants: { type: Object, default: { value: "", label: "" } },
    availability: {
      type: Boolean,
      default: true,
    },
    preparation_time: {
      type: Number, 
      required: true,
      default: 0
    },
    products: [
        {
          value: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            default: new mongoose.Types.ObjectId()
          },
          label: { type: String, required: true, default: "" },
        },
    ],
    discount: {
      active: { type: Boolean, default: false },
      percentage: { type: Number, default: 0 },
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);
MenuSchema.pre("findOne", function () {
    this.populate({
        path: "restaurant",
        select: "name"
    })
});
MenuSchema.pre("find", function () {
    this.populate({
      path: "restaurant",
      select: "name"
    });
  });
applyTransformHooks(MenuSchema, ["restaurants", "products"]);
module.exports = mongoose.model("Menu", MenuSchema);
