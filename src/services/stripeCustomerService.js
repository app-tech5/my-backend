const Stripe = require('stripe');
const User = require('../models/User');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function getUserOrThrow(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('user not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
}

async function ensureStripeCustomer(userId) {
  const user = await getUserOrThrow(userId);
  if (user.stripeCustomerId) return { user, stripeCustomerId: user.stripeCustomerId };

  const customer = await stripe.customers.create({
    email: user.email || undefined,
    name: user.name || undefined,
    metadata: { userId: String(user._id) }
  });

  user.stripeCustomerId = customer.id;
  await user.save();
  return { user, stripeCustomerId: customer.id };
}

async function attachPaymentMethodToUser(userId, paymentMethodId) {
  const { stripeCustomerId } = await ensureStripeCustomer(userId);
  await stripe.paymentMethods.attach(paymentMethodId, { customer: stripeCustomerId });
  return stripeCustomerId;
}

async function detachPaymentMethod(paymentMethodId) {
  await stripe.paymentMethods.detach(paymentMethodId);
}

module.exports = {
  stripe,
  ensureStripeCustomer,
  attachPaymentMethodToUser,
  detachPaymentMethod
};
