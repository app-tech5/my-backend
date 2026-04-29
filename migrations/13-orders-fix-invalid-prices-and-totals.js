/**
 * Corrige les valeurs invalides dans `orders`:
 * - `items[].price` null/NaN/non numérique
 * - `items[].total` NaN/non numérique
 * - agrégats `subtotal`, `tax.amount`, `totalPrice`
 *
 * Règles:
 * - price invalide -> fallback sur 0
 * - quantity invalide -> fallback sur 1
 * - extra.price invalide -> fallback sur 0
 * - extra.quantity invalide -> fallback sur 1
 * - total item = (price * quantity) + somme(extras.price * extras.quantity)
 * - subtotal = somme(items.total)
 * - tax.amount = tax.rate * subtotal (tax.rate invalide -> 0)
 * - totalPrice = subtotal + tax.amount + delivery.deliveryFee (deliveryFee invalide -> 0)
 */

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
          hasFiniteNumber(item?.price) || typeof item?.price === "string"
            ? toFiniteNumber(item.price, 0)
            : 0;

        const extras = Array.isArray(item?.extras)
          ? item.extras.map((extra) => {
              const extraPrice = toFiniteNumber(extra?.price, 0);
              const extraQty = toFiniteNumber(extra?.quantity, 1);
              const safeExtraQty = extraQty > 0 ? extraQty : 1;
              return {
                ...extra,
                price: extraPrice,
                quantity: safeExtraQty,
              };
            })
          : [];

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
          total,
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
            updatedAt: new Date(),
          },
        }
      );
    }
  },

  async down() {
    // Données d'origine potentiellement perdues (NaN/null): rollback non déterministe.
  },
};
