const mongoose = require("mongoose");
const pluralize = require("pluralize");
const applyTransformHooks = require("../utils/applyTransformHooks");
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, default: "" },
  description: { type: String, required: true, default: "" },
  price: { type: Number, required: true, default: 0 },
  currency: { type: String, select: false }, 
  image: { type: String, required: true, default: "" },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category", 
    required: true,
    default: new mongoose.Types.ObjectId()
  }, 
  categories: { type: Object, default: { value: "", label: "" } },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
    default: new mongoose.Types.ObjectId()
  }, 
  restaurants: { type: Object, default: { value: "", label: "" } },
  availability: { type: Boolean, required: true, default: false },
  preparation_time: { type: Number, required: true, default: 0 }, 
  tags: { type: [String], required: true, select: false, default: [] },
  ingredients: { type: [String], required: true, default: [] },
  discount: {
    type: Object,
    default: {
      isActive: false,
      percentage: 0,
    },
  },
  rating: {
    type: Object,
    default: {
      average: 0,
      count: 0,
    },
  },
  variants: [{
    value: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', default: null},
    label: { type: String, required: true, default: "" }
  }],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});
applyTransformHooks(ProductSchema, ["restaurants", "categories"]);
ProductSchema.pre("findOne", function () {
  this.populate([
    {
      path: "restaurant",
      select: "name", 
    },
    {
      path: "category",
      select: "name", 
    },
  ]);
});
ProductSchema.pre("find", function () {
  const { queryParams } = this.options;
  if (queryParams?.type) {
    this.where({ restaurant: queryParams.type });
  }
  this.populate([
    {
      path: "restaurant",
      select: "name", 
    },
    {
      path: "category",
      select: "name", 
    },
  ]);
});
const Product = mongoose.model("Product", ProductSchema);
module.exports = Product;
