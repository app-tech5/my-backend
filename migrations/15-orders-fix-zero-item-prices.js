
function toFiniteNumber(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function getCatalogCollection(itemType) {
  return itemType === "Menu" ? "menus" : "products";
}

function getVariantsTotal(variants = []) {
  return variants.reduce((sum, variant) => {
    const variantExtra = toFiniteNumber(variant?.extra, 0);
    const variantPrice = toFiniteNumber(variant?.price, 0);
    return sum + (variantExtra > 0 ? variantExtra : variantPrice);
  }, 0);
}

async function getRestaurantAverageUnitPrice(db, restaurantId, itemType) {
  const primaryCollection = getCatalogCollection(itemType);
  const collections = [primaryCollection];
  if (primaryCollection === "menus") {
    collections.push("products");
  }

  for (const collectionName of collections) {
    const prices = await db.
    collection(collectionName).
    find({ restaurant: restaurantId, price: { $gt: 0 } }).
    project({ price: 1 }).
    toArray();

    if (prices.length > 0) {
      const total = prices.reduce((sum, doc) => sum + toFiniteNumber(doc.price, 0), 0);
      return total / prices.length;
    }
  }

  return 0;
}

async function lookupCatalogUnitPrice(db, item) {
  if (!item?.item) {
    return 0;
  }

  const collectionName = getCatalogCollection(item.type);
  const catalogItem = await db.collection(collectionName).findOne({ _id: item.item });
  return toFiniteNumber(catalogItem?.price, 0);
}

async function resolveExtras(db, extras = []) {
  const resolved = [];

  for (const extra of extras) {
    const quantity = Math.max(toFiniteNumber(extra?.quantity, 1), 1);
    let price = toFiniteNumber(extra?.price, 0);

    if (price <= 0 && extra?.productId) {
      const product = await db.collection("products").findOne({ _id: extra.productId });
      price = toFiniteNumber(product?.price, 0);
    }

    resolved.push({
      ...extra,
      price,
      quantity
    });
  }

  return resolved;
}

async function resolveLineItem(db, item, restaurantId) {
  const quantity = Math.max(toFiniteNumber(item?.quantity, 1), 1);
  const extras = await resolveExtras(db, Array.isArray(item?.extras) ? item.extras : []);
  const variants = Array.isArray(item?.variants) ? item.variants : [];

  let unitPrice = toFiniteNumber(item?.price, 0);
  if (unitPrice <= 0) {
    unitPrice = await lookupCatalogUnitPrice(db, item);
  }
  if (unitPrice <= 0) {
    unitPrice = await getRestaurantAverageUnitPrice(db, restaurantId, item.type);
  }

  const extrasTotal = extras.reduce(
    (sum, extra) => sum + toFiniteNumber(extra.price, 0) * toFiniteNumber(extra.quantity, 1),
    0
  );
  const variantsTotal = getVariantsTotal(variants);
  const total = unitPrice * quantity + extrasTotal + variantsTotal;

  return {
    ...item,
    price: unitPrice,
    quantity,
    extras,
    variants,
    total
  };
}

function recalculateOrderTotals(items, order) {
  const subtotal = items.reduce((sum, item) => sum + toFiniteNumber(item.total, 0), 0);
  const taxRate = toFiniteNumber(order?.tax?.rate, 0);
  const taxAmount = taxRate * subtotal;
  const deliveryFee = toFiniteNumber(order?.delivery?.deliveryFee, 0);
  const totalPrice = subtotal + taxAmount + deliveryFee;

  return { subtotal, taxAmount, deliveryFee, totalPrice };
}

module.exports = {
  toFiniteNumber,
  getVariantsTotal,
  recalculateOrderTotals,

  async up(db) {
    const ordersCol = db.collection("orders");
    const orders = await ordersCol.find({}).toArray();

    for (const order of orders) {
      const rawItems = Array.isArray(order.items) ? order.items : [];
      const normalizedItems = [];

      for (const item of rawItems) {
        const currentPrice = toFiniteNumber(item?.price, 0);
        const currentTotal = toFiniteNumber(item?.total, 0);

        if (currentPrice > 0 && currentTotal > 0) {
          normalizedItems.push(item);
          continue;
        }

        normalizedItems.push(await resolveLineItem(db, item, order.restaurant));
      }

      const { subtotal, taxAmount, deliveryFee, totalPrice } = recalculateOrderTotals(
        normalizedItems,
        order
      );

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
