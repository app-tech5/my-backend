const User = require('../models/User');
const i18n = require('../config/i18n');
const { stripe, attachPaymentMethodToUser, detachPaymentMethod } = require('../services/stripeCustomerService');

const stripePaymentController = {
  attachPaymentMethodToCustomer: async (req, res) => {
    if (req.user?.isDemo) {
      return res.status(403).json({ message: i18n.__('demo_mode_action_not_available') });
    }

    const { paymentMethodId } = req.body || {};

    if (!paymentMethodId || typeof paymentMethodId !== 'string') {
      return res.status(400).json({
        message: 'paymentMethodId is required',
      });
    }

    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({
        message: 'user not found',
      });
    }

    const stripeCustomerId = await attachPaymentMethodToUser(req.user?.id, paymentMethodId);

    return res.status(200).json({
      stripeCustomerId,
      paymentMethodId,
    });
  },
  removePaymentMethod: async (req, res) => {
    if (req.user?.isDemo) {
      return res.status(403).json({ message: i18n.__('demo_mode_action_not_available') });
    }

    const { paymentMethodId } = req.body || {};
    if (!paymentMethodId || typeof paymentMethodId !== 'string') {
      return res.status(400).json({
        message: 'paymentMethodId is required',
      });
    }
    await detachPaymentMethod(paymentMethodId);
    return res.status(200).json({
      message: 'paymentMethod removed successfully',
    });
  },

  createPaymentIntent: async (req, res) => {
    const { amount, currency = 'eur' } = req.body || {};

    if (
      amount === undefined ||
      amount === null ||
      typeof amount !== 'number' ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        message: 'amount must be a positive integer (smallest currency unit, e.g. cents)',
      });
    }

    if (currency !== undefined && (typeof currency !== 'string' || currency.length !== 3)) {
      return res.status(400).json({
        message: 'currency must be a 3-letter ISO code (e.g. eur)',
      });
    }

    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({
        message: 'user not found',
      });
    }

    if (!user.stripeCustomerId) {
      return res.status(400).json({
        message: 'stripeCustomerId not found for user. Add a card first.',
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      customer: user.stripeCustomerId,
    });

    res.status(200).json(paymentIntent);
  },
};

module.exports = stripePaymentController;
