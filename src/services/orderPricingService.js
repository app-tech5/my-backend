const { getActiveBenefits } = require('./subscriptionService');

function roundMoney(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function applyCustomerBenefitsToAmounts({
  subtotal,
  deliveryFee,
  taxRate = 0,
  benefits
}) {
  let nextSubtotal = roundMoney(subtotal);
  let nextDelivery = roundMoney(deliveryFee);
  const discountPercent = Math.min(
    100,
    Math.max(0, Number(benefits?.discountPercent) || 0)
  );
  const freeDelivery = !!(benefits?.active && benefits?.freeDelivery);
  const applyDiscount = !!(benefits?.active && discountPercent > 0);

  let discountAmount = 0;
  if (applyDiscount) {
    discountAmount = roundMoney(nextSubtotal * discountPercent / 100);
    nextSubtotal = roundMoney(nextSubtotal - discountAmount);
  }

  if (freeDelivery) {
    nextDelivery = 0;
  }

  const rate =
  Number(taxRate) > 1 ? Number(taxRate) / 100 : Math.max(0, Number(taxRate) || 0);
  const taxAmount = roundMoney(nextSubtotal * rate);
  const totalPrice = roundMoney(nextSubtotal + taxAmount + nextDelivery);

  return {
    subtotal: nextSubtotal,
    deliveryFee: nextDelivery,
    taxRate: rate,
    taxAmount,
    totalPrice,
    discountPercent: applyDiscount ? discountPercent : 0,
    discountAmount,
    memberFreeDelivery: freeDelivery
  };
}

async function priceOrderForCustomer({
  userId,
  subtotal,
  deliveryFee,
  taxRate = 0
}) {
  const benefits = userId ?
  await getActiveBenefits(userId, 'customer') :
  { active: false };
  return {
    benefits,
    ...applyCustomerBenefitsToAmounts({
      subtotal,
      deliveryFee,
      taxRate,
      benefits
    })
  };
}

module.exports = {
  applyCustomerBenefitsToAmounts,
  priceOrderForCustomer
};
