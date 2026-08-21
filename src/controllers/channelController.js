const {
  getChannelConfig,
  handleUssdSession,
  createChannelOrder,
  sendWhatsAppMessage,
  resolveWhatsAppConfig
} = require('../services/channelService');
const AppSetting = require('../models/AppSetting');

async function getConfig(_req, res) {
  try {
    const config = await getChannelConfig();
    return res.json(config);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function ussdWebhook(req, res) {
  try {
    const body = req.body || {};
    const result = await handleUssdSession({
      sessionId: body.sessionId || body.session_id,
      phoneNumber: body.phoneNumber || body.phone_number || body.msisdn,
      text: body.text || body.ussd_string || '',
      serviceCode: body.serviceCode || body.service_code
    });

    if (req.query.format === 'json' || req.headers.accept?.includes('json')) {
      return res.json(result);
    }
    res.type('text/plain').send(result.response || 'END OK');
  } catch (error) {
    return res.status(500).type('text/plain').send('END Error');
  }
}

async function whatsappWebhookVerify(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const settings = await AppSetting.findOne().lean();
  const expected = resolveWhatsAppConfig(settings).verifyToken;
  if (mode === 'subscribe' && token === expected) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
}

async function whatsappWebhook(req, res) {

  try {
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    const messages = changes?.messages || [];
    const statuses = changes?.statuses || [];
    if (messages.length) {

      console.info(
        '[whatsapp] inbound',
        messages.map((m) => ({
          from: m.from,
          type: m.type,
          text: m?.text?.body || '',
          timestamp: m.timestamp
        }))
      );
    }
    if (statuses.length) {
      console.info(
        '[whatsapp] status',
        statuses.map((s) => ({
          id: s.id,
          status: s.status,
          recipient_id: s.recipient_id,
          timestamp: s.timestamp,
          error: s.errors?.[0]?.message || null
        }))
      );
    }
  } catch (_) {

  }
  return res.sendStatus(200);
}

async function createOrder(req, res) {
  try {
    const {
      source = 'web',
      restaurantId,
      items,
      delivery,
      paymentMethod,
      phone,
      channelMeta,
      userId
    } = req.body || {};

    const order = await createChannelOrder({
      source,
      userId: userId || req.user?._id,
      restaurantId,
      items,
      delivery,
      paymentMethod,
      phone,
      channelMeta
    });
    return res.status(201).json({ order });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
}

async function testWhatsApp(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    const { to, body } = req.body || {};
    const result = await sendWhatsAppMessage({ to, body: body || 'Good Food Pro test message' });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getConfig,
  ussdWebhook,
  whatsappWebhookVerify,
  whatsappWebhook,
  createOrder,
  testWhatsApp
};
