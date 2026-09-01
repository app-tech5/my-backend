const {
  isSmtpConfigured,
  buildLicenseInquiryEmail,
  sendLicenseInquiryEmail,
} = require('../../src/utils/licenseInquiryMailer');

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}));

describe('licenseInquiryMailer', () => {
  const inquiry = {
    email: 'buyer@example.com',
    name: 'Jane Doe',
    role: 'Founder',
    message: 'I want to license Good Food Pro.',
    source: 'pro-site',
  };

  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env = { ...envBackup };
    mockSendMail.mockClear();
  });

  afterAll(() => {
    process.env = envBackup;
  });

  it('detects missing SMTP config', () => {
    delete process.env.SMTP_HOST;
    expect(isSmtpConfigured()).toBe(false);
  });

  it('builds email with default recipient', () => {
    process.env.SMTP_USER = 'smtp@example.com';
    const mail = buildLicenseInquiryEmail(inquiry);
    expect(mail.to).toBe('cabliveer@gmail.com');
    expect(mail.from).toBe('smtp@example.com');
    expect(mail.subject).toContain('Jane Doe');
    expect(mail.text).toContain('buyer@example.com');
  });

  it('skips send when SMTP is not configured', async () => {
    delete process.env.SMTP_HOST;
    const result = await sendLicenseInquiryEmail(inquiry);
    expect(result.skipped).toBe(true);
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('sends email when SMTP is configured', async () => {
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_USER = 'cabliveer@gmail.com';
    process.env.SMTP_PASS = 'app-password';
    process.env.LICENSE_INQUIRY_TO = 'alerts@example.com';

    const result = await sendLicenseInquiryEmail(inquiry);

    expect(result.sent).toBe(true);
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'alerts@example.com',
      replyTo: 'buyer@example.com',
    }));
  });
});
