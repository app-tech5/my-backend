const i18n = require('../config/i18n');
const {
  createAccountUpdateLink,
  retrieveConnectAccount,
  syncConnectPayoutMethod,
  transferToDriver,
} = require('../services/stripeConnectService');

function assertDriverUser(req, res) {
  if (req.user?.isDemo) {
    res.status(403).json({ message: i18n.__('demo_mode_action_not_available') });
    return false;
  }

  if (req.user?.type !== 'delivery') {
    res.status(403).json({ message: 'Only delivery accounts can use Stripe Connect' });
    return false;
  }

  return true;
}

function resolveConnectUrls(req) {
  const refreshUrl =
    req.body?.refreshUrl ||
    process.env.STRIPE_CONNECT_REFRESH_URL ||
    'goodfooddriver://stripe-connect/refresh';
  const returnUrl =
    req.body?.returnUrl ||
    process.env.STRIPE_CONNECT_RETURN_URL ||
    'goodfooddriver://stripe-connect/return';

  return { refreshUrl, returnUrl };
}

const stripeConnectController = {
  startOnboarding: async (req, res) => {
    try {
      if (!assertDriverUser(req, res)) return;

      const { refreshUrl, returnUrl } = resolveConnectUrls(req);
      const onboarding = await createAccountUpdateLink(req.user.id, {
        refreshUrl,
        returnUrl,
      });

      return res.status(200).json(onboarding);
    } catch (error) {
      console.error('Stripe Connect onboarding error:', error);
      return res.status(error.statusCode || 500).json({
        message: error.message || i18n.__('server_error'),
      });
    }
  },

  getStatus: async (req, res) => {
    try {
      if (!assertDriverUser(req, res)) return;

      const status = await retrieveConnectAccount(req.user.id);
      let paymentMethod = null;

      if (status.connected) {
        paymentMethod = await syncConnectPayoutMethod(req.user.id);
      }

      return res.status(200).json({
        ...status,
        paymentMethod,
      });
    } catch (error) {
      console.error('Stripe Connect status error:', error);
      return res.status(error.statusCode || 500).json({
        message: error.message || i18n.__('server_error'),
      });
    }
  },

  syncPayoutMethod: async (req, res) => {
    try {
      if (!assertDriverUser(req, res)) return;

      const paymentMethod = await syncConnectPayoutMethod(req.user.id);

      if (!paymentMethod) {
        return res.status(404).json({ message: 'Stripe Connect account not found' });
      }

      return res.status(200).json({ paymentMethod });
    } catch (error) {
      console.error('Stripe Connect sync error:', error);
      return res.status(error.statusCode || 500).json({
        message: error.message || i18n.__('server_error'),
      });
    }
  },

  createTransfer: async (req, res) => {
    try {
      if (req.user?.isDemo) {
        return res.status(403).json({ message: i18n.__('demo_mode_action_not_available') });
      }

      const { amount, currency, metadata } = req.body || {};
      const targetUserId = req.body?.userId || req.user.id;

      const transfer = await transferToDriver(targetUserId, {
        amount,
        currency,
        metadata,
      });

      return res.status(200).json({ transfer });
    } catch (error) {
      console.error('Stripe Connect transfer error:', error);
      return res.status(error.statusCode || 500).json({
        message: error.message || i18n.__('server_error'),
      });
    }
  },
};

module.exports = stripeConnectController;
