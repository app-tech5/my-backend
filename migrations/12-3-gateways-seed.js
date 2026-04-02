/**
 * Seed initial payment gateways into the `gateways` collection.
 * Based on the Gateway Mongoose model (src/models/Gateway.js).
 *
 * up   → insère les 8 passerelles (skip si déjà présentes par identifier)
 * down → supprime uniquement les documents créés par cette migration
 */

const IDENTIFIERS = [
  'stripe',
  'paypal',
  'flutterwave',
  'paystack',
  'orange-pay',
  'razorpay',
  'cash-on-delivery',
  'internal-wallet',
];

const now = new Date();

const gateways = [
  {
    identifier: 'stripe',
    name: 'Stripe',
    image: 'https://cdn.simpleicons.org/stripe',
    credentials: {
      publishableKey: 'pk_test_51ODemo_StripePublishableKeyForTestingPurposes',
      secretKey: 'sk_test_51ODemo_StripeSecretKeyForTestingPurposesOnly',
      webhookSecret: 'whsec_demo_stripe_webhook_signing_secret_test',
    },
    fees: { percentage: 2.9, fixed: 30 },
    active: true,
    capabilities: {
      canRefund: true,
      canWithdraw: true,
      hasWebhook: true,
      isSubscriptionReady: true,
    },
    webhook: {},
    metadata: {
      documentationUrl: 'https://stripe.com/docs',
      apiVersion: '2023-10-16',
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    identifier: 'paypal',
    name: 'PayPal',
    image: 'https://cdn.simpleicons.org/paypal',
    credentials: {
      clientId: 'ADemo_PayPal_ClientId_ForSandboxTestingPurposesOnly',
      clientSecret: 'EDemo_PayPal_ClientSecret_ForSandboxTestingPurposesOnly',
      mode: 'sandbox',
    },
    fees: { percentage: 3.49, fixed: 49 },
    active: true,
    capabilities: {
      canRefund: true,
      canWithdraw: true,
      hasWebhook: true,
      isSubscriptionReady: true,
    },
    webhook: {},
    metadata: {
      documentationUrl: 'https://developer.paypal.com/docs',
      apiVersion: 'v2',
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    identifier: 'flutterwave',
    name: 'Flutterwave',
    image: 'https://cdn.simpleicons.org/flutterwave',
    credentials: {
      publicKey: 'FLWPUBK_TEST-demo_flutterwave_public_key_for_testing',
      secretKey: 'FLWSECK_TEST-demo_flutterwave_secret_key_for_testing',
      encryptionKey: 'FLWENCK_TEST_demo_flutterwave_encryption_key',
    },
    fees: { percentage: 1.4, fixed: 0 },
    active: true,
    capabilities: {
      canRefund: true,
      canWithdraw: true,
      hasWebhook: true,
      isSubscriptionReady: false,
    },
    webhook: {},
    metadata: {
      documentationUrl: 'https://developer.flutterwave.com/docs',
      apiVersion: 'v3',
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    identifier: 'paystack',
    name: 'Paystack',
    image: 'https://cdn.simpleicons.org/paystack',
    credentials: {
      publicKey: 'pk_test_demo_paystack_public_key_for_testing_purposes',
      secretKey: 'sk_test_demo_paystack_secret_key_for_testing_purposes',
    },
    fees: { percentage: 1.5, fixed: 0 },
    active: true,
    capabilities: {
      canRefund: true,
      canWithdraw: true,
      hasWebhook: true,
      isSubscriptionReady: true,
    },
    webhook: {},
    metadata: {
      documentationUrl: 'https://paystack.com/docs',
      apiVersion: 'v1',
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    identifier: 'orange-pay',
    name: 'OrangePay',
    image: 'https://cdn.simpleicons.org/orange',
    credentials: {
      merchantId: 'OM_DEMO_MERCHANT_001',
      apiKey: 'demo_orange_api_key_for_testing_purposes_only',
      clientId: 'demo_orange_client_id',
      clientSecret: 'demo_orange_client_secret',
    },
    fees: { percentage: 1.0, fixed: 0 },
    active: true,
    capabilities: {
      canRefund: false,
      canWithdraw: false,
      hasWebhook: true,
      isSubscriptionReady: false,
    },
    webhook: {},
    metadata: {
      documentationUrl: 'https://developer.orange.com/apis/orange-money-webpay',
      apiVersion: 'v1',
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    identifier: 'razorpay',
    name: 'Razorpay',
    image: 'https://cdn.simpleicons.org/razorpay',
    credentials: {
      keyId: 'rzp_test_demo_razorpay_key_id_for_testing',
      keySecret: 'demo_razorpay_key_secret_for_testing_purposes',
    },
    fees: { percentage: 2.0, fixed: 0 },
    active: true,
    capabilities: {
      canRefund: true,
      canWithdraw: true,
      hasWebhook: true,
      isSubscriptionReady: true,
    },
    webhook: {},
    metadata: {
      documentationUrl: 'https://razorpay.com/docs',
      apiVersion: 'v1',
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    identifier: 'cash-on-delivery',
    name: 'Cash on Delivery',
    image: 'https://cdn.simpleicons.org/cashapp',
    credentials: {
      enabled: true,
    },
    fees: { percentage: 0, fixed: 0 },
    active: true,
    capabilities: {
      canRefund: false,
      canWithdraw: false,
      hasWebhook: false,
      isSubscriptionReady: false,
    },
    webhook: {},
    metadata: {
      documentationUrl: '',
      apiVersion: '',
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    identifier: 'internal-wallet',
    name: 'Internal Wallet',
    image: 'https://cdn.simpleicons.org/wallet',
    credentials: {
      platformSecret: 'demo_internal_wallet_platform_secret_key_for_testing',
    },
    fees: { percentage: 0, fixed: 0 },
    active: true,
    capabilities: {
      canRefund: true,
      canWithdraw: false,
      hasWebhook: false,
      isSubscriptionReady: false,
    },
    webhook: {},
    metadata: {
      documentationUrl: '',
      apiVersion: '',
    },
    createdAt: now,
    updatedAt: now,
  },
];

module.exports = {
  up: async (db) => {
    const col = db.collection('gateways');

    for (const gateway of gateways) {
      const exists = await col.findOne({ identifier: gateway.identifier });
      if (!exists) {
        await col.insertOne(gateway);
      }
    }
  },

  down: async (db) => {
    const col = db.collection('gateways');
    await col.deleteMany({ identifier: { $in: IDENTIFIERS } });
  },
};