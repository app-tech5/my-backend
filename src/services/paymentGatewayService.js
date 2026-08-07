const Gateway = require('../models/Gateway');
const {
  assertPaymentMethodAllowed,
} = require('./paymentEligibilityService');

async function getActiveGateway(identifier) {
  const id = String(identifier).toLowerCase();
  await assertPaymentMethodAllowed(id);
  const gw = await Gateway.findOne({ identifier: id, active: true });
  if (!gw) {
    const err = new Error(`Gateway '${identifier}' is not active`);
    err.status = 400;
    throw err;
  }
  const creds = {};
  if (gw.credentials && typeof gw.credentials.forEach === 'function') {
    gw.credentials.forEach((v, k) => {
      creds[k] = v;
    });
  } else if (gw.credentials && typeof gw.credentials === 'object') {
    Object.assign(creds, gw.credentials);
  }
  return { gateway: gw, credentials: creds };
}

function moneyToMinor(amount, currency) {
  const zeroDecimal = ['JPY', 'KRW', 'XOF', 'XAF', 'UGX', 'VND'];
  const n = Number(amount);
  if (zeroDecimal.includes(String(currency || '').toUpperCase())) return Math.round(n);
  return Math.round(n * 100);
}

/**
 * Initialize a hosted checkout / payment session for a PSP.
 * Returns redirect/authorization payload the client can open.
 */
async function initializePayment({
  provider,
  amount,
  currency = 'USD',
  email,
  reference,
  callbackUrl,
  metadata = {},
}) {
  const id = String(provider || '').toLowerCase();
  const { credentials } = await getActiveGateway(id);
  const cur = String(currency || 'USD').toUpperCase();
  const ref = reference || `gf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  if (id === 'paystack') {
    const secret = credentials.secretKey;
    if (!secret || String(secret).includes('demo_')) {
      return demoInit(id, amount, cur, ref, 'Configure Paystack secretKey in Admin → Gateways');
    }
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email || 'customer@example.com',
        amount: moneyToMinor(amount, cur),
        currency: cur,
        reference: ref,
        callback_url: callbackUrl,
        metadata,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.status) {
      throw Object.assign(new Error(data.message || 'Paystack init failed'), { status: 502, data });
    }
    return {
      provider: id,
      reference: ref,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      raw: data.data,
    };
  }

  if (id === 'flutterwave') {
    const secret = credentials.secretKey;
    if (!secret || String(secret).includes('demo_')) {
      return demoInit(id, amount, cur, ref, 'Configure Flutterwave secretKey in Admin → Gateways');
    }
    const res = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: ref,
        amount: Number(amount),
        currency: cur,
        redirect_url: callbackUrl,
        customer: { email: email || 'customer@example.com' },
        meta: metadata,
        customizations: { title: 'Good Food Order', description: `Order ${ref}` },
      }),
    });
    const data = await res.json();
    if (!res.ok || data.status !== 'success') {
      throw Object.assign(new Error(data.message || 'Flutterwave init failed'), { status: 502, data });
    }
    return {
      provider: id,
      reference: ref,
      authorizationUrl: data.data.link,
      raw: data.data,
    };
  }

  if (id === 'razorpay') {
    const keyId = credentials.keyId || credentials.publicKey;
    const keySecret = credentials.keySecret || credentials.secretKey;
    if (!keyId || !keySecret || String(keySecret).includes('demo_')) {
      return demoInit(id, amount, cur, ref, 'Configure Razorpay keyId/keySecret in Admin → Gateways');
    }
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: moneyToMinor(amount, cur),
        currency: cur,
        receipt: ref,
        notes: metadata,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw Object.assign(new Error(data.error?.description || 'Razorpay order failed'), { status: 502, data });
    }
    return {
      provider: id,
      reference: ref,
      orderId: data.id,
      keyId,
      amount: data.amount,
      currency: data.currency,
      raw: data,
    };
  }

  if (id === 'paypal') {
    const clientId = credentials.clientId;
    const clientSecret = credentials.clientSecret;
    const mode = credentials.mode === 'live' ? 'live' : 'sandbox';
    if (!clientId || !clientSecret || String(clientId).includes('Demo')) {
      return demoInit(id, amount, cur, ref, 'Configure PayPal clientId/clientSecret in Admin → Gateways');
    }
    const base = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      throw Object.assign(new Error('PayPal auth failed'), { status: 502, data: tokenData });
    }
    const orderRes = await fetch(`${base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: ref,
            amount: { currency_code: cur, value: Number(amount).toFixed(2) },
            custom_id: metadata.orderId || ref,
          },
        ],
        application_context: {
          return_url: callbackUrl || `${process.env.PUBLIC_APP_URL || 'https://example.com'}/paypal/return`,
          cancel_url: callbackUrl || `${process.env.PUBLIC_APP_URL || 'https://example.com'}/paypal/cancel`,
        },
      }),
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      throw Object.assign(new Error(orderData.message || 'PayPal order failed'), { status: 502, data: orderData });
    }
    const approve = (orderData.links || []).find((l) => l.rel === 'approve');
    return {
      provider: id,
      reference: ref,
      orderId: orderData.id,
      authorizationUrl: approve?.href,
      raw: orderData,
    };
  }

  if (id === 'crypto' || id === 'coinbase-commerce') {
    return demoInit(id, amount, cur, ref, 'Crypto gateway slot — plug Coinbase Commerce / NOWPayments keys in Admin');
  }

  const err = new Error(`Unsupported payment provider: ${id}`);
  err.status = 400;
  throw err;
}

function demoInit(provider, amount, currency, reference, hint) {
  return {
    provider,
    reference,
    demo: true,
    amount: Number(amount),
    currency,
    authorizationUrl: null,
    message: hint,
  };
}

module.exports = {
  getActiveGateway,
  initializePayment,
};
