const AppSetting = require('../models/AppSetting');
const Order = require('../models/Order');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

function resolveWhatsAppConfig(settings) {
  const phoneNumberId =
  settings?.whatsappPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  const accessToken =
  settings?.whatsappAccessToken || process.env.WHATSAPP_ACCESS_TOKEN || '';
  const verifyToken =
  settings?.whatsappVerifyToken || process.env.WHATSAPP_VERIFY_TOKEN || 'goodfood_whatsapp_verify';
  const templateLang =
  settings?.whatsappTemplateLang || process.env.WHATSAPP_TEMPLATE_LANG || 'en';

  return {
    enabled: !!settings?.whatsappEnabled,
    phoneNumberId,
    accessToken,
    verifyToken,
    templateLang,
    configured: !!(phoneNumberId && accessToken)
  };
}

async function getChannelConfig() {
  const settings = await AppSetting.findOne().lean();
  const wa = resolveWhatsAppConfig(settings);
  return {
    whatsapp: {
      enabled: wa.enabled,
      phoneNumberId: wa.phoneNumberId,

      configured: wa.configured,
      templateLang: wa.templateLang
    },
    ussd: {
      enabled: !!settings?.ussdEnabled,
      shortCode: settings?.ussdShortCode || '',
      configured: !!(settings?.ussdApiKey && settings?.ussdShortCode)
    },
    webOrdering: {
      enabled: settings?.webOrderingEnabled !== false
    }
  };
}

async function sendWhatsAppMessage({ to, body, templateName, templateLang = 'en', components }) {
  const settings = await AppSetting.findOne().lean();
  const wa = resolveWhatsAppConfig(settings);
  if (!wa.enabled) {
    return { skipped: true, reason: 'whatsapp_disabled' };
  }
  const token = wa.accessToken;
  const phoneNumberId = wa.phoneNumberId;
  if (!token || !phoneNumberId || String(token).includes('demo')) {
    return { skipped: true, reason: 'whatsapp_not_configured', demo: true };
  }

  const toDigits = String(to || '').replace(/\D/g, '');
  if (!toDigits) {
    return { skipped: true, reason: 'missing_phone' };
  }

  const payload = templateName ?
  {
    messaging_product: 'whatsapp',
    to: toDigits,
    type: 'template',
    template: {
      name: templateName,
      language: { code: templateLang || wa.templateLang },
      components: components || []
    }
  } :
  {
    messaging_product: 'whatsapp',
    to: toDigits,
    type: 'text',
    text: { body: String(body || '').slice(0, 4096) }
  };

  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, status: res.status, data };
  }
  return {
    ok: true,
    messageId: data?.messages?.[0]?.id || null,
    contactWaId: data?.contacts?.[0]?.wa_id || null,
    data
  };
}

async function notifyOrderViaChannels(order, { title, message }) {
  const settings = await AppSetting.findOne().lean();
  const userId = order?.user?._id || order?.user;
  const user = userId ? await User.findById(userId).select('phone name').lean() : null;
  const results = {};
  if (settings?.whatsappNotifyOnStatus !== false && user?.phone) {
    results.whatsapp = await sendWhatsAppMessage({
      to: user.phone,
      body: `${title}\n${message}`
    });
  }
  return results;
}

async function handleUssdSession({ sessionId, phoneNumber, text = '', serviceCode }) {
  const settings = await AppSetting.findOne().lean();
  if (!settings?.ussdEnabled) {
    return { response: 'END Service unavailable', sessionId };
  }

  const parts = String(text || '').
  split('*').
  map((s) => s.trim()).
  filter(Boolean);
  const choice = parts[parts.length - 1] || '';

  const user = await User.findOne({
    phone: { $regex: String(phoneNumber || '').replace(/\D/g, '').slice(-9) + '$' },
    role: 'customer'
  }).lean();

  if (!choice) {
    return {
      response:
      'CON Good Food\n1. Last order status\n2. Repeat last order\n3. Help\n0. Exit',
      sessionId,
      serviceCode
    };
  }

  if (choice === '0') {
    return { response: 'END Thank you.', sessionId };
  }

  if (choice === '1') {
    if (!user) {
      return { response: 'END No account linked to this number. Open the app to register.', sessionId };
    }
    const last = await Order.findOne({ user: user._id }).sort({ createdAt: -1 }).lean();
    if (!last) {
      return { response: 'END No orders found.', sessionId };
    }
    return {
      response: `END Order ${String(last._id).slice(-6)}: ${last.status}. Total ${last.totalPrice}`,
      sessionId
    };
  }

  if (choice === '2') {
    if (!user) {
      return { response: 'END Link your phone in the customer app first.', sessionId };
    }
    const last = await Order.findOne({ user: user._id, status: 'delivered' }).
    sort({ createdAt: -1 }).
    lean();
    if (!last) {
      return { response: 'END No previous order to repeat. Order in the app or WhatsApp.', sessionId };
    }

    const clone = await Order.create({
      user: last.user,
      restaurant: last.restaurant,
      items: last.items,
      totalPrice: last.totalPrice,
      subtotal: last.subtotal,
      tax: last.tax,
      status: 'pending',
      payment: {
        method: 'cash_on_delivery',
        status: 'pending'
      },
      delivery: last.delivery,
      orderSource: 'ussd',
      channelMeta: { sessionId, phoneNumber, serviceCode }
    });
    return {
      response: `END Repeat order placed (#${String(clone._id).slice(-6)}). Pay on delivery. Track in the app.`,
      sessionId,
      orderId: clone._id
    };
  }

  if (choice === '3') {
    return {
      response: 'END Help: open the Good Food app, or WhatsApp the support number from Admin settings.',
      sessionId
    };
  }

  return { response: 'END Invalid option.', sessionId };
}

async function createChannelOrder({
  source,
  userId,
  restaurantId,
  items,
  delivery,
  paymentMethod = 'cash_on_delivery',
  phone,
  channelMeta = {}
}) {
  const allowed = ['whatsapp', 'ussd', 'web', 'admin'];
  if (!allowed.includes(source)) {
    throw Object.assign(new Error('Invalid order source'), { status: 400 });
  }

  let user = userId ? await User.findById(userId) : null;
  if (!user && phone) {
    user = await User.findOne({ phone: String(phone), role: 'customer' });
  }
  if (!user) {
    throw Object.assign(new Error('Customer not found — register phone in app first'), { status: 404 });
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    throw Object.assign(new Error('Restaurant not found'), { status: 404 });
  }

  const normalizedItems = (items || []).map((it) => ({
    type: it.type || 'Product',
    item: it.item || it.productId,
    name: it.name,
    image: it.image || restaurant.image || '',
    price: Number(it.price),
    currency: it.currency || 'USD',
    quantity: Number(it.quantity || 1),
    extras: it.extras || [],
    variants: it.variants || [],
    total: Number(it.total ?? Number(it.price) * Number(it.quantity || 1))
  }));

  const { assertPaymentMethodAllowed } = require('./paymentEligibilityService');
  const { priceOrderForCustomer } = require('./orderPricingService');

  await assertPaymentMethodAllowed(paymentMethod);

  const rawSubtotal = normalizedItems.reduce((s, it) => s + Number(it.total || 0), 0);
  const taxRate = Number(restaurant.tax?.rate ?? 0) > 1 ?
  Number(restaurant.tax.rate) / 100 :
  Number(restaurant.tax?.rate || 0);
  const priced = await priceOrderForCustomer({
    userId: user._id,
    subtotal: rawSubtotal,
    deliveryFee: Number(delivery?.deliveryFee || 0),
    taxRate
  });

  const order = await Order.create({
    user: user._id,
    restaurant: restaurant._id,
    items: normalizedItems,
    subtotal: priced.subtotal,
    tax: { rate: priced.taxRate, amount: priced.taxAmount },
    totalPrice: priced.totalPrice,
    status: 'pending',
    payment: {
      method: paymentMethod,
      status: paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending'
    },
    delivery: {
      ...(delivery || { type: 'delivery', address: user.address || '' }),
      deliveryFee: priced.deliveryFee
    },
    orderSource: source,
    channelMeta: {
      ...channelMeta,
      ...(priced.discountAmount > 0 || priced.memberFreeDelivery ?
      {
        membership: {
          discountPercent: priced.discountPercent,
          discountAmount: priced.discountAmount,
          freeDelivery: priced.memberFreeDelivery,
          planName: priced.benefits?.planName
        }
      } :
      {})
    }
  });

  return order;
}

module.exports = {
  getChannelConfig,
  resolveWhatsAppConfig,
  sendWhatsAppMessage,
  notifyOrderViaChannels,
  handleUssdSession,
  createChannelOrder
};
