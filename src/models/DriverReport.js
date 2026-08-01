const mongoose = require('mongoose');
const { Schema } = mongoose;
const i18n = require('../config/i18n');
const driverReportSchema = new Schema({
  reportType: {
    type: String,
    required: true,
    enum: [
      'late_delivery',
      'rude_behavior',
      'unprofessional',
      'wrong_order',
      'safety_concern',
      'driving_issues',
      'other'
    ],
    default: 'other'
  },
  description: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 1000
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  reporter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },
  images: [{
    type: String, 
    validate: {
      validator: function(v) {
        return v.length <= 5; 
      },
      message: i18n.__('maximum_5_images_allowed')
    }
  }],
  videos: [{
    type: String, 
    validate: {
      validator: function(v) {
        return v.length <= 2; 
      },
      message: i18n.__('maximum_2_videos_allowed')
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed', 'requires_action'],
    default: 'pending'
  },
  adminNotes: [{
    note: String,
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'Admin'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolution: {
    type: String,
    enum: ['warning_issued', 'driver_suspended', 'driver_terminated', 'compensation_issued', 'no_action'],
    required: function() {
      return this.status === 'resolved';
    }
  },
  resolutionDetails: {
    type: String,
    required: function() {
      return this.status === 'resolved';
    },
    maxlength: 2000
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    required: function() {
      return this.status === 'resolved';
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
driverReportSchema.index({ driver: 1, status: 1 });
driverReportSchema.index({ reporter: 1 });
driverReportSchema.index({ order: 1 });
driverReportSchema.index({ createdAt: -1 });
driverReportSchema.pre(["find", "findOne"], function () {
  this.populate([
    { path: "reporter", select: "name email image" },
    {
      path: "driver",
      select: "userId",
      populate: { path: "userId", select: "name phone image" },
    },
    { path: "order", select: "status totalPrice createdAt" },
    { path: "adminNotes.admin", select: "name" },
  ]);
});
driverReportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});
driverReportSchema.methods.addAdminNote = function(noteContent, adminId) {
  this.adminNotes.push({
    note: noteContent,
    admin: adminId
  });
  return this.save();
};
driverReportSchema.methods.updateStatus = function(newStatus, resolutionType, resolutionDetails) {
  this.status = newStatus;
  if (newStatus === 'resolved') {
    this.resolution = resolutionType;
    this.resolutionDetails = resolutionDetails;
    this.resolvedAt = new Date();
  }
  return this.save();
};
driverReportSchema.virtual('processingTime').get(function() {
  if (this.status === 'resolved' && this.resolvedAt && this.createdAt) {
    return this.resolvedAt - this.createdAt;
  }
  return null;
});
const DriverReport = mongoose.model('DriverReport', driverReportSchema);
module.exports = DriverReport;