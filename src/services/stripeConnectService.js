const PaymentMethod = require('../models/PaymentMethod');
const User = require('../models/User');
const { stripe } = require('./stripeCustomerService');

const CONNECT_COUNTRY = process.env.STRIPE_CONNECT_COUNTRY || 'FR';

async function getUserOrThrow(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('user not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
}

async function ensureConnectAccount(userId) {
  const user = await getUserOrThrow(userId);

  if (user.stripeConnectAccountId) {
    return { user, accountId: user.stripeConnectAccountId };
  }

  const account = await stripe.accounts.create({
    type: 'express',
    country: CONNECT_COUNTRY,
    email: user.email || undefined,
    capabilities: {
      transfers: { requested: true },
    },
    business_type: 'individual',
    metadata: {
      userId: String(user._id),
      role: user.role || 'delivery',
    },
  });

  user.stripeConnectAccountId = account.id;
  await user.save();

  return { user, accountId: account.id };
}

async function createOnboardingLink(userId, { refreshUrl, returnUrl }) {
  const { accountId } = await ensureConnectAccount(userId);

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  return {
    accountId,
    url: accountLink.url,
    expiresAt: accountLink.expires_at,
  };
}

async function createAccountUpdateLink(userId, { refreshUrl, returnUrl }) {
  const user = await getUserOrThrow(userId);

  if (!user.stripeConnectAccountId) {
    return createOnboardingLink(userId, { refreshUrl, returnUrl });
  }

  const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
  const linkType = account.details_submitted ? 'account_update' : 'account_onboarding';

  const accountLink = await stripe.accountLinks.create({
    account: user.stripeConnectAccountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: linkType,
  });

  return {
    accountId: user.stripeConnectAccountId,
    url: accountLink.url,
    expiresAt: accountLink.expires_at,
    linkType,
  };
}

async function retrieveConnectAccount(userId) {
  const user = await getUserOrThrow(userId);

  if (!user.stripeConnectAccountId) {
    return {
      connected: false,
      accountId: null,
      detailsSubmitted: false,
      payoutsEnabled: false,
      chargesEnabled: false,
    };
  }

  const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);

  return {
    connected: true,
    accountId: account.id,
    detailsSubmitted: Boolean(account.details_submitted),
    payoutsEnabled: Boolean(account.payouts_enabled),
    chargesEnabled: Boolean(account.charges_enabled),
  };
}

async function syncConnectPayoutMethod(userId) {
  const user = await getUserOrThrow(userId);

  if (!user.stripeConnectAccountId) {
    return null;
  }

  const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
  const externalAccounts = await stripe.accounts.listExternalAccounts(
    user.stripeConnectAccountId,
    { object: 'bank_account', limit: 1 }
  );
  const bankAccount = externalAccounts.data[0] || null;

  const verificationStatus =
    account.payouts_enabled && account.details_submitted ? 'verified' : 'pending';

  const payload = {
    id: `stripe_connect_${user.stripeConnectAccountId}`,
    user: user._id,
    methodType: 'bank_transfer',
    purpose: 'payout',
    stripeConnectAccountId: user.stripeConnectAccountId,
    isDefault: true,
    isActive: true,
    verificationStatus,
    verificationDate: verificationStatus === 'verified' ? new Date() : null,
    bankDetails: bankAccount
      ? {
          accountHolderName: bankAccount.account_holder_name || user.name || '',
          ibanLast4: bankAccount.last4 || '',
          bankName: bankAccount.bank_name || '',
        }
      : {
          accountHolderName: user.name || '',
          ibanLast4: '',
          bankName: '',
        },
  };

  const existing = await PaymentMethod.findOne({
    user: user._id,
    purpose: 'payout',
    $or: [
      { stripeConnectAccountId: user.stripeConnectAccountId },
      { id: payload.id },
      { id: 'demo_payout_stripe_connect' },
    ],
  });

  await PaymentMethod.updateMany(
    { user: user._id, purpose: 'payout' },
    { $set: { isDefault: false } }
  );

  let paymentMethod;
  if (existing) {
    paymentMethod = await PaymentMethod.findByIdAndUpdate(
      existing._id,
      { $set: payload },
      { new: true, runValidators: true }
    );
  } else {
    paymentMethod = await PaymentMethod.create(payload);
  }

  return paymentMethod;
}

async function transferToDriver(userId, { amount, currency = 'eur', metadata = {} }) {
  const user = await getUserOrThrow(userId);

  if (!user.stripeConnectAccountId) {
    const error = new Error('driver stripe connect account not found');
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    const error = new Error('amount must be a positive integer in smallest currency unit');
    error.statusCode = 400;
    throw error;
  }

  const transfer = await stripe.transfers.create({
    amount,
    currency: currency.toLowerCase(),
    destination: user.stripeConnectAccountId,
    metadata: {
      userId: String(user._id),
      ...metadata,
    },
  });

  return transfer;
}

module.exports = {
  ensureConnectAccount,
  createOnboardingLink,
  createAccountUpdateLink,
  retrieveConnectAccount,
  syncConnectPayoutMethod,
  transferToDriver,
};
