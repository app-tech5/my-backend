
module.exports = {
  async up(db) {
    const now = new Date();

    const langs = db.collection('languages');
    for (const row of [
    { code: 'es', name: 'Spanish', isDefault: false, rtl: false },
    { code: 'ar', name: 'Arabic', isDefault: false, rtl: true }])
    {
      await langs.updateOne(
        { code: row.code },
        { $set: { ...row, updatedAt: now }, $setOnInsert: { createdAt: now } },
        { upsert: true }
      );
    }
    await langs.updateOne({ code: 'en' }, { $set: { rtl: false, updatedAt: now } });
    await langs.updateOne({ code: 'fr' }, { $set: { rtl: false, updatedAt: now } });

    await db.collection('appsettings').updateMany(
      {},
      {
        $set: {
          walletCashbackEnabled: true,
          walletCashbackPercent: 2,
          walletInstantRefundEnabled: true,
          whatsappEnabled: false,
          whatsappNotifyOnStatus: true,
          ussdEnabled: false,
          webOrderingEnabled: true,
          updatedAt: now
        }
      }
    );

    await db.collection('gateways').updateOne(
      { identifier: 'crypto' },
      {
        $set: {
          identifier: 'crypto',
          name: 'Crypto (Commerce)',
          image: 'https://cdn.simpleicons.org/bitcoin',
          credentials: {
            apiKey: 'demo_crypto_commerce_api_key',
            webhookSecret: 'demo_crypto_webhook_secret'
          },
          fees: { percentage: 1.0, fixed: 0 },
          active: true,
          capabilities: {
            canRefund: false,
            canWithdraw: false,
            hasWebhook: true,
            isSubscriptionReady: false
          },
          webhook: {},
          metadata: {
            documentationUrl: 'https://commerce.coinbase.com/docs/',
            apiVersion: 'v1',
            note: 'Plug Coinbase Commerce or NOWPayments keys — initialize returns demo until configured'
          },
          updatedAt: now
        },
        $setOnInsert: { createdAt: now }
      },
      { upsert: true }
    );
  },

  async down(db) {
    await db.collection('languages').deleteMany({ code: { $in: ['es', 'ar'] } });
    await db.collection('gateways').deleteOne({ identifier: 'crypto' });
  }
};
