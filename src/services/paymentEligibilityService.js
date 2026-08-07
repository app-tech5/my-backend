const AppSetting = require('../models/AppSetting');
const Gateway = require('../models/Gateway');

const STRIPE_METHODS = new Set([
  'credit_card',
  'debit_card',
  'apple_pay',
  'google_pay',
  'stripe',
]);

const COD_METHODS = new Set(['cash_on_delivery', 'cash-on-delivery', 'cod']);

function normalizeMethod(method) {
  return String(method || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

async function getPaymentFlags() {
  const settings = await AppSetting.findOne()
    .select('cashOnDeliveryEnabled stripeEnabled')
    .lean();
  return {
    cashOnDeliveryEnabled: settings?.cashOnDeliveryEnabled !== false,
    stripeEnabled: !!settings?.stripeEnabled,
  };
}

/**
 * Keep Gateway.active aligned with App Settings COD / Stripe toggles
 * so Admin list + checkout see the same truth.
 */
async function syncGatewayFlagsFromAppSettings(settings) {
  if (!settings) return;
  const ops = [];
  if (typeof settings.cashOnDeliveryEnabled === 'boolean') {
    ops.push(
      Gateway.updateOne(
        { identifier: 'cash-on-delivery' },
        { $set: { active: !!settings.cashOnDeliveryEnabled } }
      )
    );
  }
  if (typeof settings.stripeEnabled === 'boolean') {
    ops.push(
      Gateway.updateOne(
        { identifier: 'stripe' },
        { $set: { active: !!settings.stripeEnabled } }
      )
    );
  }
  if (ops.length) await Promise.all(ops);
}

/**
 * Reject payment methods that App Settings / Gateways have turned off.
 * @param {string} method - Order.payment.method or PaymentMethod.methodType or gateway identifier
 */
async function assertPaymentMethodAllowed(method) {
  const m = normalizeMethod(method);
  if (!m || m === 'platform_credit') return;

  const flags = await getPaymentFlags();

  if (COD_METHODS.has(m)) {
    if (!flags.cashOnDeliveryEnabled) {
      const err = new Error('Cash on delivery is disabled in marketplace settings');
      err.status = 400;
      throw err;
    }
    return;
  }

  if (STRIPE_METHODS.has(m)) {
    if (!flags.stripeEnabled) {
      const err = new Error('Stripe card payments are disabled in marketplace settings');
      err.status = 400;
      throw err;
    }
    const gw = await Gateway.findOne({ identifier: 'stripe' }).select('active').lean();
    if (gw && gw.active === false) {
      const err = new Error("Gateway 'stripe' is not active");
      err.status = 400;
      throw err;
    }
    return;
  }

  // Other PSPs: Gateway.active is the switch (initialize path already checks)
  if (['paystack', 'flutterwave', 'razorpay', 'paypal', 'crypto', 'orangepay', 'orange-pay'].includes(m)) {
    const gw = await Gateway.findOne({ identifier: m.replace('orange-pay', 'orangepay') })
      .select('active')
      .lean();
    if (!gw || !gw.active) {
      const err = new Error(`Gateway '${m}' is not active`);
      err.status = 400;
      throw err;
    }
  }
}

/**
 * Filter gateway list for checkout UX — respects App Settings + Gateway.active.
 */
async function filterListedProviders(gateways) {
  const flags = await getPaymentFlags();
  return (gateways || []).filter((g) => {
    const id = String(g.identifier || g.id || '').toLowerCase();
    if (id === 'cash-on-delivery' || id === 'cash_on_delivery') {
      return flags.cashOnDeliveryEnabled;
    }
    if (id === 'stripe') {
      return flags.stripeEnabled;
    }
    return true;
  });
}

module.exports = {
  getPaymentFlags,
  syncGatewayFlagsFromAppSettings,
  assertPaymentMethodAllowed,
  filterListedProviders,
  STRIPE_METHODS,
  COD_METHODS,
};
