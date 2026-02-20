const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema({
  
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
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
        select: "name", 
      });
})

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

notificationSchema.pre('save', function(next) {
  if (this.expiresAt && this.expiresAt < new Date()) {
    this.isRead = true; 
  }
  next();
});

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