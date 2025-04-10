const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema({
  // Destinataire
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Contenu
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  imageUrl: {
    type: String,
    required: false,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/).+\.(jpg|jpeg|png|gif)$/i.test(v);
      },
      message: props => `${props.value} n'est pas une URL d'image valide!`
    }
  },
  
  // Type et contexte
  type: {
    type: String,
    required: true,
    enum: [
      'order_status', 
      'promotion', 
      'system', 
      'delivery_update',
      'new_restaurant',
      'payment',
      'account'
    ],
    default: 'system'
  },
  relatedEntity: {
    type: Schema.Types.ObjectId,
    required: function() {
      return ['order_status', 'delivery_update', 'payment'].includes(this.type);
    },
    refPath: 'relatedEntityModel'
  },
  relatedEntityModel: {
    type: String,
    required: function() {
      return ['order_status', 'delivery_update', 'payment'].includes(this.type);
    },
    enum: ['Order', 'Payment', 'Delivery']
  },
  
  // Comportement
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  isActionRequired: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String,
    required: function() {
      return this.isActionRequired;
    },
    validate: {
      validator: function(v) {
        return /^(https?:\/\/).+/i.test(v);
      },
      message: props => `${props.value} n'est pas une URL valide!`
    }
  },
  
  // Expiration et priorité
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  expiresAt: {
    type: Date,
    required: false,
    index: true
  },
  
  // Métadonnées
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  createdBy: {
    type: String,
    enum: ['system', 'restaurant', 'admin', 'delivery'],
    default: 'system'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

notificationSchema.pre("find", function () {
    this.populate(
      {
        path: "user",
        select: "name", // On suppose que votre modèle Category a un champ "name"
      });
})

// Index pour les requêtes fréquentes
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Méthode pour marquer comme lue
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Middleware pour nettoyer les notifications expirées
notificationSchema.pre('save', function(next) {
  if (this.expiresAt && this.expiresAt < new Date()) {
    this.isRead = true; // Marquer comme lue si expirée
  }
  next();
});

// Statics pour les requêtes courantes
notificationSchema.statics.findUnreadForUser = function(userId) {
  return this.find({ user: userId, isRead: false })
             .sort({ createdAt: -1 })
             .limit(50);
};

notificationSchema.statics.createOrderNotification = async function(userId, orderId, message, title = 'Mise à jour de commande') {
  return this.create({
    user: userId,
    title,
    message,
    type: 'order_status',
    relatedEntity: orderId,
    relatedEntityModel: 'Order',
    priority: 'high'
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;