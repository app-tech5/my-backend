const mongoose = require('mongoose');

const LicenseInquirySchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ['Founder', 'Agency', 'Restaurant operator', 'Other'],
    },
    message: { type: String, required: true, trim: true },
    source: { type: String, default: 'pro-site', trim: true },
    status: {
      type: String,
      enum: ['new', 'contacted', 'closed'],
      default: 'new',
    },
  },
  { timestamps: true }
);

LicenseInquirySchema.index({ createdAt: -1 });
LicenseInquirySchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model('LicenseInquiry', LicenseInquirySchema);
