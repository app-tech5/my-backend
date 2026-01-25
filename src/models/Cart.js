const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  // Informations compatibles avec les données du frontend
  id: { type: String, required: true }, // ID de l'item dans le frontend

  // Référence à l'item (menu ou produit) - optionnel pour compatibilité
  item: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "itemType"
  },
  itemType: {
    type: String,
    enum: ["Menu", "Product"]
  },

  // Informations de base de l'item
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: "EUR" },

  // Quantité
  quantity: { type: Number, required: true, min: 1, default: 1 },

  // Extras et variants - rendus optionnels pour compatibilité
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

  // Prix calculé
  totalPrice: { type: Number, required: true },

  // Clé unique pour éviter les conflits
  uniqueKey: { type: String, required: true },

  // Informations du restaurant
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant"
  },
  restaurantName: { type: String, required: true },
  restaurantImage: { type: String },

  // Métadonnées
  addedAt: { type: Date, default: Date.now }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true // Un panier par utilisateur
  },

  items: [cartItemSchema],

  // Informations de session/device pour la synchronisation
  deviceId: { type: String },
  sessionId: { type: String },

  // Métadonnées
  lastModified: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expire après 7 jours
    index: { expires: 0 }
  }
}, {
  timestamps: true
});

// Index pour les performances
cartSchema.index({ user: 1 });
cartSchema.index({ deviceId: 1 });
cartSchema.index({ sessionId: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Middleware pour mettre à jour lastModified
cartSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Méthodes statiques
cartSchema.statics.findByUser = function(userId) {
  return this.findOne({ user: userId });
};

cartSchema.statics.findByDevice = function(deviceId) {
  return this.findOne({ deviceId });
};

cartSchema.statics.findBySession = function(sessionId) {
  return this.findOne({ sessionId });
};

// Fonction utilitaire pour corriger les items sans id
const fixItemsWithoutId = (items) => {
  return items.map(item => {
    if (!item.id) {
      item.id = item._id || item.uniqueKey || `item_${Date.now()}_${Math.random()}`;
    }
    return item;
  });
};

// Méthodes d'instance
cartSchema.methods.addItem = function(itemData) {
  // Corriger automatiquement les items existants qui n'ont pas d'id
  this.items = fixItemsWithoutId(this.items);

  // Redux ajoute chaque item individuellement, même pour les quantités
  // On ajoute simplement l'item tel quel
  this.items.push(itemData);
  return this.save();
};

cartSchema.methods.removeItem = function(itemId) {
  // Corriger automatiquement les items existants qui n'ont pas d'id
  this.items = fixItemsWithoutId(this.items);

  // Redux supprime par ID (le premier item trouvé avec cet ID)
  const itemIndex = this.items.findIndex(item => item.id === itemId);
  if (itemIndex >= 0) {
    this.items.splice(itemIndex, 1);
  }
  return this.save();
};

cartSchema.methods.updateItem = function(itemId, itemData) {
  // Corriger automatiquement les items existants qui n'ont pas d'id
  this.items = fixItemsWithoutId(this.items);

  // Redux met à jour par ID
  const itemIndex = this.items.findIndex(item => item.id === itemId);
  if (itemIndex >= 0) {
    this.items[itemIndex] = { ...this.items[itemIndex], ...itemData };
  }
  return this.save();
};

cartSchema.methods.clearRestaurant = function(restaurantName) {
  // Corriger automatiquement les items existants qui n'ont pas d'id
  this.items = fixItemsWithoutId(this.items);

  // Redux garde seulement les items qui n'ont pas ce restaurantName
  this.items = this.items.filter(item => item.restaurantName !== restaurantName);
  return this.save();
};

cartSchema.methods.clear = function() {
  // Pas besoin de correction ici car on vide le tableau
  this.items = [];
  return this.save();
};

cartSchema.methods.getTotal = function() {
  return this.items.reduce((total, item) => total + item.totalPrice, 0);
};

cartSchema.methods.getItemCount = function() {
  return this.items.length; // Chaque item représente une quantité de 1
};

module.exports = mongoose.model("Cart", cartSchema);
