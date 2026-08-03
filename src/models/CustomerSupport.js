const mongoose = require('mongoose');
const { Schema } = mongoose;
const CustomerSupportSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['ticket', 'live_chat', 'faq'],
    default: 'ticket'
  },
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    default:  null
  },
  users: { type: Object, default: { value: "", label: "" } },
  subject: { 
    type: String, 
    required: function() { 
      return this.type === 'ticket'; 
    } 
  },
  description: { 
    type: String, 
    required: function() { 
      return this.type !== 'faq'; 
    } 
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
    required: function() { 
      return this.type === 'ticket'; 
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    required: function() { 
      return this.type === 'ticket'; 
    }
  },
  order: { 
    type: Schema.Types.ObjectId, 
    ref: 'Order' 
  },
  chat_messages: [{
    sender: {
      type: String,
      enum: ['user', 'support_agent', 'admin'],
      required: function() { 
        return this.type === 'live_chat'; 
      }
    },
    content: { 
      type: String, 
      required: function() { 
        return this.type === 'live_chat'; 
      } 
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    }
  }],
  chat_status: {
    type: String,
    enum: ['active', 'ended'],
    default: 'active',
    required: function() { 
      return this.type === 'live_chat'; 
    }
  },
  question: { 
    type: String, 
    required: function() { 
      return this.type === 'faq'; 
    } 
  },
  answer: { 
    type: String, 
    required: function() { 
      return this.type === 'faq'; 
    } 
  },
  faq_category: {
    type: String,
    enum: ['delivery', 'payment', 'account', 'other'],
    default: 'other',
    required: function() { 
      return this.type === 'faq'; 
    }
  },
  assigned_to: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  updated_at: { 
    type: Date 
  },
  resolved_at: { 
    type: Date 
  }
}, { timestamps: true });
CustomerSupportSchema.pre("find", function () {
  const { queryParams } = this.options || {};
  if (queryParams?.type) {
    this.where({ type: queryParams.type });
  }

  this.populate([
    {
      path: "user",
      select: "name", 
    },
    {
      path: "assigned_to",
      select: "name email", 
    },
    {
      path: "order",
      select: "status totalPrice restaurant",
      populate: {
        path: "restaurant",
        select: "name",
      },
    },
  ]);
});

CustomerSupportSchema.pre("findOne", function () {
  this.populate([
    {
      path: "user",
      select: "name",
    },
    {
      path: "assigned_to",
      select: "name email",
    },
    {
      path: "order",
      select: "status totalPrice restaurant",
      populate: {
        path: "restaurant",
        select: "name",
      },
    },
  ]);
});
CustomerSupportSchema.index({ type: 1, status: 1 });
CustomerSupportSchema.index({ user: 1 });
CustomerSupportSchema.index({ assigned_to: 1 });
const CustomerSupport = mongoose.model('CustomerSupport', CustomerSupportSchema);
module.exports = CustomerSupport;