
const { ObjectId } = require('mongodb');

const DEMO_USER_ID = new ObjectId('6979f426af5473434a8de666');
const DEMO_DRIVER_ID = new ObjectId('6979f43d81158605b78de666');
const SEED_KEY = 'migration_26_demo_driver_payout_methods';
const DEMO_STRIPE_CONNECT_ACCOUNT_ID = 'acct_demo_driver_payout';

const DEMO_PM_STRIPE_ID = new ObjectId('6979f500af5473434a8de601');
const DEMO_PM_PAYPAL_ID = new ObjectId('6979f500af5473434a8de602');

function buildSeedPaymentMethods(now = new Date()) {
  return [
  {
    _id: DEMO_PM_STRIPE_ID,
    id: `stripe_connect_${DEMO_STRIPE_CONNECT_ACCOUNT_ID}`,
    user: DEMO_USER_ID,
    methodType: 'bank_transfer',
    purpose: 'payout',
    isDefault: true,
    isActive: true,
    stripeConnectAccountId: DEMO_STRIPE_CONNECT_ACCOUNT_ID,
    bankDetails: {
      accountHolderName: 'Jean Dupont',
      ibanLast4: '7890',
      bankName: 'BNP Paribas'
    },
    verificationStatus: 'verified',
    verificationDate: now,
    migrationSeedKey: SEED_KEY,
    createdAt: now,
    updatedAt: now
  },
  {
    _id: DEMO_PM_PAYPAL_ID,
    id: 'demo_payout_paypal',
    user: DEMO_USER_ID,
    methodType: 'paypal',
    purpose: 'payout',
    isDefault: false,
    isActive: true,
    paypalEmail: 'driver.paypal@demo.com',
    verificationStatus: 'verified',
    verificationDate: now,
    migrationSeedKey: SEED_KEY,
    createdAt: now,
    updatedAt: now
  }];

}

async function up(db) {
  const paymentMethodsCol = db.collection('paymentmethods');
  const usersCol = db.collection('users');

  const alreadySeeded = await paymentMethodsCol.countDocuments({
    migrationSeedKey: SEED_KEY
  });

  if (alreadySeeded > 0) {
    console.log('✅ Modes de versement déjà seedés pour le driver démo');
    return;
  }

  const demoUser = await usersCol.findOne({ _id: DEMO_USER_ID });
  if (!demoUser) {
    console.log('⚠️ User démo introuvable — migration ignorée');
    return;
  }

  const now = new Date();
  const paymentMethods = buildSeedPaymentMethods(now);

  await paymentMethodsCol.insertMany(paymentMethods);

  await usersCol.updateOne(
    { _id: DEMO_USER_ID },
    {
      $set: {
        stripeConnectAccountId: DEMO_STRIPE_CONNECT_ACCOUNT_ID,
        updatedAt: now
      }
    }
  );

  console.log(
    `✅ ${paymentMethods.length} mode(s) de versement seedé(s) pour le driver démo (user ${DEMO_USER_ID})`
  );
}

async function down(db) {
  const paymentMethodsCol = db.collection('paymentmethods');
  const usersCol = db.collection('users');

  const result = await paymentMethodsCol.deleteMany({ migrationSeedKey: SEED_KEY });

  await usersCol.updateOne(
    {
      _id: DEMO_USER_ID,
      stripeConnectAccountId: DEMO_STRIPE_CONNECT_ACCOUNT_ID
    },
    {
      $set: { stripeConnectAccountId: '' }
    }
  );

  console.log(`↩️ ${result.deletedCount} mode(s) de versement supprimé(s)`);
}

module.exports = {
  DEMO_USER_ID,
  DEMO_DRIVER_ID,
  SEED_KEY,
  DEMO_STRIPE_CONNECT_ACCOUNT_ID,
  DEMO_PM_STRIPE_ID,
  DEMO_PM_PAYPAL_ID,
  buildSeedPaymentMethods,
  up,
  down
};
