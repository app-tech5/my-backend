const { validateLicenseInquiry } = require('../../src/utils/licenseInquiryValidation');

describe('validateLicenseInquiry', () => {
  const valid = {
    email: 'buyer@example.com',
    name: 'Jane Doe',
    role: 'Founder',
    message: 'I want to license Good Food Pro for my marketplace.',
  };

  it('accepts valid payload', () => {
    const result = validateLicenseInquiry(valid);
    expect(result.errors).toEqual({});
    expect(result.values.email).toBe('buyer@example.com');
  });

  it('rejects empty payload', () => {
    const result = validateLicenseInquiry({});
    expect(result.errors.email).toBeDefined();
    expect(result.errors.name).toBeDefined();
    expect(result.errors.role).toBeDefined();
    expect(result.errors.message).toBeDefined();
  });

  it('rejects short message', () => {
    const result = validateLicenseInquiry({ ...valid, message: 'too short' });
    expect(result.errors.message).toMatch(/15 characters/);
  });

  it('treats honeypot as success', () => {
    const result = validateLicenseInquiry({ ...valid, company: 'Acme Corp' });
    expect(result.honeypot).toBe(true);
  });
});
