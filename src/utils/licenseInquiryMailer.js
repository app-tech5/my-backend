const nodemailer = require('nodemailer');

const DEFAULT_TO = 'cabliveer@gmail.com';

function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

function getMailConfig() {
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };
}

function buildLicenseInquiryEmail(inquiry) {
  const to = (process.env.LICENSE_INQUIRY_TO || DEFAULT_TO).trim();
  const from = (process.env.LICENSE_INQUIRY_FROM || process.env.SMTP_USER || '').trim();
  const subject = `Good Food Pro — license inquiry from ${inquiry.name}`;
  const text = [
    'New license inquiry from good-foods.digitaldienste.fr/pro/get/',
    '',
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    `Role: ${inquiry.role}`,
    `Source: ${inquiry.source || 'pro-site'}`,
    '',
    'Message:',
    inquiry.message,
  ].join('\n');

  return { to, from, subject, text };
}

async function sendLicenseInquiryEmail(inquiry) {
  if (!isSmtpConfigured()) {
    return { sent: false, skipped: true, reason: 'smtp_not_configured' };
  }

  const { to, from, subject, text } = buildLicenseInquiryEmail(inquiry);
  const transporter = nodemailer.createTransport(getMailConfig());

  await transporter.sendMail({ from, to, subject, text, replyTo: inquiry.email });

  return { sent: true, to };
}

module.exports = {
  isSmtpConfigured,
  buildLicenseInquiryEmail,
  sendLicenseInquiryEmail,
};
