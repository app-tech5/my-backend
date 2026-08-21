const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const AppSetting = require('../models/AppSetting');

async function getWalletBalance(userId) {
  const uid = new mongoose.Types.ObjectId(String(userId));
  const rows = await Transaction.aggregate([
  {
    $match: {
      status: 'completed',
      user: uid
    }
  },
  {
    $group: {
      _id: null,
      credit: {
        $sum: {
          $cond: [
          { $in: ['$transaction_type', ['customer_top_up', 'refund', 'adjustment', 'cashback']] },
          '$amount',
          0]

        }
      },
      debit: {
        $sum: {
          $cond: [
          {
            $and: [
            { $eq: ['$transaction_type', 'customer_payment'] },
            { $eq: ['$payment_method', 'platform_credit'] }]

          },
          '$amount',
          0]

        }
      }
    }
  }]
  );
  const row = rows[0] || { credit: 0, debit: 0 };
  return Math.max(0, Number(row.credit || 0) - Number(row.debit || 0));
}

async function creditWallet({
  userId,
  amount,
  currency = 'USD',
  transactionType = 'refund',
  relatedOrder = null,
  description = '',
  metadata = {}
}) {
  const amt = Math.round(Number(amount) * 100) / 100;
  if (!(amt > 0)) {
    throw new Error('Wallet credit amount must be > 0');
  }

  const doc = await Transaction.create({
    transaction_type: transactionType,
    amount: amt,
    currency: String(currency || 'USD').toUpperCase().slice(0, 3),
    status: 'completed',
    payment_method: 'platform_credit',
    date_completed: new Date(),
    related_order: relatedOrder || undefined,
    user: userId
  });

  return {
    transaction: doc,
    balance: await getWalletBalance(userId)
  };
}

async function refundOrderToWallet(order, { reason = 'order_cancelled' } = {}) {
  if (!order?._id || !order?.user) {
    return null;
  }
  const userId = order.user._id || order.user;
  const amount = Number(order.totalPrice || 0);
  if (!(amount > 0)) return null;

  const paid =
  order.payment?.status === 'paid' ||
  ['credit_card', 'paypal', 'mobile_money', 'google_pay', 'apple_pay', 'paystack', 'flutterwave', 'razorpay', 'wallet'].includes(
    order.payment?.method
  );
  if (!paid && order.payment?.method === 'cash_on_delivery') {
    return null;
  }

  const existing = await Transaction.findOne({
    related_order: order._id,
    transaction_type: 'refund',
    status: 'completed'
  }).lean();
  if (existing) {
    return { skipped: true, reason: 'already_refunded', transaction: existing };
  }

  const currency =
  order.items?.[0]?.currency ||
  order.payment?.currency ||
  'USD';

  return creditWallet({
    userId,
    amount,
    currency,
    transactionType: 'refund',
    relatedOrder: order._id,
    description: `Instant wallet refund (${reason})`,
    metadata: {
      reason,
      orderId: String(order._id),
      originalMethod: order.payment?.method || null,
      instant: true
    }
  });
}

async function applyOrderCashback(order) {
  if (!order?._id || order.status !== 'delivered') return null;

  const settings = await AppSetting.findOne().lean();
  const enabled = settings?.walletCashbackEnabled !== false;
  const percent = Number(settings?.walletCashbackPercent ?? 2);
  if (!enabled || !(percent > 0)) return null;

  const existing = await Transaction.findOne({
    related_order: order._id,
    transaction_type: 'cashback',
    status: 'completed'
  }).lean();
  if (existing) {
    return { skipped: true, reason: 'already_cashed_back' };
  }

  const base = Number(order.subtotal || order.totalPrice || 0);
  const amount = Math.round(base * (percent / 100) * 100) / 100;
  if (!(amount > 0)) return null;

  const userId = order.user._id || order.user;
  const currency = order.items?.[0]?.currency || 'USD';

  return creditWallet({
    userId,
    amount,
    currency,
    transactionType: 'cashback',
    relatedOrder: order._id,
    description: `Cashback ${percent}%`,
    metadata: {
      percent,
      orderId: String(order._id)
    }
  });
}

module.exports = {
  getWalletBalance,
  creditWallet,
  refundOrderToWallet,
  applyOrderCashback
};
