const { initializePayment } = require('../services/paymentGatewayService');

async function initialize(req, res) {
  try {
    const {
      provider,
      amount,
      currency,
      email,
      reference,
      callbackUrl,
      metadata
    } = req.body || {};

    if (!provider || !(Number(amount) > 0)) {
      return res.status(400).json({ message: 'provider and amount are required' });
    }

    const result = await initializePayment({
      provider,
      amount,
      currency: currency || 'USD',
      email: email || req.user?.email,
      reference,
      callbackUrl,
      metadata: { ...(metadata || {}), userId: String(req.user?._id || '') }
    });

    return res.json(result);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      message: error.message || 'Payment init failed',
      data: error.data
    });
  }
}

async function listProviders(_req, res) {
  const Gateway = require('../models/Gateway');
  const {
    filterListedProviders
  } = require('../services/paymentEligibilityService');
  const rows = await Gateway.find({ active: true }).
  select('identifier name image capabilities fees active metadata').
  lean();
  const filtered = await filterListedProviders(rows);
  return res.json({
    providers: filtered.map((g) => ({
      id: g.identifier,
      name: g.name,
      image: g.image,
      capabilities: g.capabilities,
      fees: g.fees
    }))
  });
}

module.exports = { initialize, listProviders };
