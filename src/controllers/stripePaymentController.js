const Stripe = require('stripe');
const User = require('../models/User');

const stripe = new Stripe('sk_test_51TIcAILenxtQOhEhGELACfIVrHZVNG7WwUO0YxXKecYqIvX0JZx10vpEgT8QMD0pVvaFj9O2NTGxtq712ZaxTF6i001wWeZeez');

const stripePaymentController = {
  attachPaymentMethodToCustomer: async (req, res) => {
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

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.name || undefined,
        metadata: { userId: String(user._id) },
      });
      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }

    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });

    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return res.status(200).json({
      stripeCustomerId,
      paymentMethodId,
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
