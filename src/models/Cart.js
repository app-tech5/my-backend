const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  
  id: { type: String, required: true }, 
  
  item: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "itemType"
  },
  itemType: {
    type: String,
    enum: ["Menu", "Product"]
  },
  
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: "EUR" },
  
  quantity: { type: Number, required: true, min: 1, default: 1 },
  
  extras: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String },
    price: { type: Number },
    quantity: { type: Number, default: 1 }
  }],
  variants: [{
    name: { type: String },
    price: { type: Number },
    extra: { type: Number },
    size: { type: String }
  }],
  
  totalPrice: { type: Number, required: true },
  
  uniqueKey: { type: String, required: true },
  
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant"
  },
  restaurantName: { type: String, required: true },
  restaurantImage: { type: String },
  
  addedAt: { type: Date, default: Date.now }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true 
  },

  items: [cartItemSchema],
  
  deviceId: { type: String },
  sessionId: { type: String },
  
  lastModified: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
    index: { expires: 0 }
  }
}, {
  timestamps: true
});

cartSchema.index({ user: 1 });
cartSchema.index({ deviceId: 1 });
cartSchema.index({ sessionId: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

cartSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

cartSchema.statics.findByUser = function(userId) {
  return this.findOne({ user: userId });
};

cartSchema.statics.findByDevice = function(deviceId) {
  return this.findOne({ deviceId });
};

cartSchema.statics.findBySession = function(sessionId) {
  return this.findOne({ sessionId });
};

const fixItemsWithoutId = (items) => {
  return items.map(item => {
    if (!item.id) {
      item.id = item._id || item.uniqueKey || `item_${Date.now()}_${Math.random()}`;
    }
    return item;
  });
};

cartSchema.methods.addItem = function(itemData) {
  
  this.items = fixItemsWithoutId(this.items);
  
  this.items.push(itemData);
  return this.save();
};

cartSchema.methods.removeItem = function(itemId) {
  
  this.items = fixItemsWithoutId(this.items);
  
  const itemIndex = this.items.findIndex(item => item.id === itemId);
  if (itemIndex >= 0) {
    this.items.splice(itemIndex, 1);
  }
  return this.save();
};

cartSchema.methods.updateItem = function(itemId, itemData) {
  
  this.items = fixItemsWithoutId(this.items);
  
  const itemIndex = this.items.findIndex(item => item.id === itemId);
  if (itemIndex >= 0) {
    this.items[itemIndex] = { ...this.items[itemIndex], ...itemData };
  }
  return this.save();
};

cartSchema.methods.clearRestaurant = function(restaurantName) {
  
  this.items = fixItemsWithoutId(this.items);
  
  this.items = this.items.filter(item => item.restaurantName !== restaurantName);
  return this.save();
};

cartSchema.methods.clear = function() {
  
  this.items = [];
  return this.save();
};

cartSchema.methods.getTotal = function() {
  return this.items.reduce((total, item) => total + item.totalPrice, 0);
};

cartSchema.methods.getItemCount = function() {
  return this.items.length; 
};

module.exports = mongoose.model("Cart", cartSchema);
