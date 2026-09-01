const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const ALLOWED_ROLES = ['Founder', 'Agency', 'Restaurant operator', 'Other'];

function validateLicenseInquiry(body = {}) {
  const errors = {};
  const email = String(body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  const role = String(body.role || '').trim();
  const message = String(body.message || '').trim();
  const company = String(body.company || '').trim();

  if (company) {
    return { honeypot: true, errors: {}, values: null };
  }
  if (!email) errors.email = 'Email is required.';
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
  if (!name) errors.name = 'Name is required.';
  else if (name.length < 2) errors.name = 'Name must be at least 2 characters.';
  else if (name.length > 80) errors.name = 'Name must be 80 characters or fewer.';
  if (!role) errors.role = 'Please select who you are.';
  else if (!ALLOWED_ROLES.includes(role)) errors.role = 'Please choose a valid option.';
  if (!message) errors.message = 'Message is required.';
  else if (message.length < 15) errors.message = 'Message must be at least 15 characters.';
  else if (message.length > 2000) errors.message = 'Message must be 2000 characters or fewer.';

  if (Object.keys(errors).length) {
    return { honeypot: false, errors, values: null };
  }

  return {
    honeypot: false,
    errors: {},
    values: {
      email,
      name,
      role,
      message,
      source: String(body.source || 'pro-site').trim() || 'pro-site',
    },
  };
}

module.exports = { validateLicenseInquiry, ALLOWED_ROLES, EMAIL_RE };
