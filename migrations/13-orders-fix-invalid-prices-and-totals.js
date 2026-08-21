
function toFiniteNumber(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function hasFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

module.exports = {
  async up(db) {
    const ordersCol = db.collection("orders");
    const orders = await ordersCol.find({}).toArray();

    for (const order of orders) {
      const rawItems = Array.isArray(order.items) ? order.items : [];
      const normalizedItems = rawItems.map((item) => {
        const quantity = toFiniteNumber(item?.quantity, 1);
        const safeQuantity = quantity > 0 ? quantity : 1;

        const price =
        hasFiniteNumber(item?.price) || typeof item?.price === "string" ?
        toFiniteNumber(item.price, 0) :
        0;

        const extras = Array.isArray(item?.extras) ?
        item.extras.map((extra) => {
          const extraPrice = toFiniteNumber(extra?.price, 0);
          const extraQty = toFiniteNumber(extra?.quantity, 1);
          const safeExtraQty = extraQty > 0 ? extraQty : 1;
          return {
            ...extra,
            price: extraPrice,
            quantity: safeExtraQty
          };
        }) :
        [];

        const extrasTotal = extras.reduce(
          (sum, extra) => sum + extra.price * extra.quantity,
          0
        );

        const total = price * safeQuantity + extrasTotal;

        return {
          ...item,
          price,
          quantity: safeQuantity,
          extras,
          total
        };
      });

      const subtotal = normalizedItems.reduce(
        (sum, item) => sum + toFiniteNumber(item.total, 0),
        0
      );

      const taxRate = toFiniteNumber(order?.tax?.rate, 0);
      const taxAmount = taxRate * subtotal;
      const deliveryFee = toFiniteNumber(order?.delivery?.deliveryFee, 0);
      const totalPrice = subtotal + taxAmount + deliveryFee;

      await ordersCol.updateOne(
        { _id: order._id },
        {
          $set: {
            items: normalizedItems,
            subtotal,
            "tax.amount": taxAmount,
            totalPrice,
            "delivery.deliveryFee": deliveryFee,
            updatedAt: new Date()
          }
        }
      );
    }
  },

  async down() {

  }
};
