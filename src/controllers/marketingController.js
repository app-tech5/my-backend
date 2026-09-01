const LicenseInquiry = require('../models/LicenseInquiry');
const { validateLicenseInquiry } = require('../utils/licenseInquiryValidation');
const { sendLicenseInquiryEmail } = require('../utils/licenseInquiryMailer');

async function createLicenseInquiry(req, res) {
  try {
    const result = validateLicenseInquiry(req.body || {});

    if (result.honeypot) {
      return res.status(200).json({
        success: true,
        message: 'Message sent. Thank you — we will get back to you soon.',
      });
    }

    if (Object.keys(result.errors).length) {
      return res.status(400).json({
        success: false,
        message: 'Please fix the highlighted fields.',
        errors: result.errors,
      });
    }

    const inquiry = await LicenseInquiry.create(result.values);
    sendLicenseInquiryEmail(inquiry.toObject()).catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'Message sent. Thank you — we will get back to you soon.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not send right now. Try again in a moment.',
    });
  }
}

module.exports = { createLicenseInquiry };
