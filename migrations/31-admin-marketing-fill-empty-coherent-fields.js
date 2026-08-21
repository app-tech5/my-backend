
const SEED_KEY = 'migration_31_admin_marketing_fill_empty';

const RESTAURANT_PROFILES = {
  'Le Petit Bistrot': {
    categories: ['French'],
    description:
    'Classic French bistro with seasonal plates, wine pairings, and a cozy Parisian dining room.',
    phone: '01 42 33 21 10',
    serviceModes: 'delivery'
  },
  'Maison du Burger': {
    categories: ['American', 'Fast Food'],
    description:
    'Craft burgers, crispy fries, and milkshakes made with premium ingredients.',
    phone: '01 43 55 12 88',
    serviceModes: 'delivery'
  },
  'Sakura Sushi': {
    categories: ['Asian'],
    description:
    'Fresh sushi, sashimi, and Japanese bowls prepared by our Tokyo-trained chefs.',
    phone: '01 44 61 09 27',
    serviceModes: 'delivery'
  },
  'Trattoria Roma': {
    categories: ['Italian'],
    description:
    'Homemade pasta, wood-fired pizzas, and Italian classics from family recipes.',
    phone: '01 45 78 33 41',
    serviceModes: 'delivery'
  },
  'Green Bowl Kitchen': {
    categories: ['Mediterranean'],
    description:
    'Healthy bowls, salads, and grain plates packed with fresh Mediterranean flavors.',
    phone: '01 46 22 74 05',
    serviceModes: 'pickup'
  },
  'Paris Pizza Co.': {
    categories: ['Pizza', 'Italian'],
    description:
    'Neapolitan-style pizzas with slow-fermented dough and seasonal toppings.',
    phone: '01 47 00 58 19',
    serviceModes: 'delivery'
  },
  'The Smokehouse': {
    categories: ['American'],
    description:
    'Slow-smoked BBQ ribs, brisket, and Southern sides with house sauces.',
    phone: '01 48 15 66 30',
    serviceModes: 'delivery'
  },
  'Café Lumière': {
    categories: ['French'],
    description:
    'All-day café serving pastries, brunch plates, and specialty coffee.',
    phone: '01 42 89 14 56',
    serviceModes: 'pickup'
  },
  'Ocean Catch': {
    categories: ['Seafood'],
    description:
    'Market-fresh seafood platters, grilled fish, and coastal specialties.',
    phone: '01 43 27 91 08',
    serviceModes: 'delivery'
  },
  'Spice Route': {
    categories: ['Asian', 'Mediterranean'],
    description:
    'Bold spices from Asia and the Mediterranean — curries, mezze, and share plates.',
    phone: '01 44 53 70 22',
    serviceModes: 'delivery'
  },
  'Brick Oven': {
    categories: ['Pizza', 'Italian'],
    description:
    'Stone-baked pizzas and Italian sides from our wood-fired brick oven.',
    phone: '01 45 11 38 64',
    serviceModes: 'delivery'
  },
  'Harvest Table': {
    categories: ['French', 'Mediterranean'],
    description:
    'Farm-to-table seasonal menus with local produce and thoughtful plating.',
    phone: '01 46 74 02 91',
    serviceModes: 'delivery'
  },
  'Night Owl Diner': {
    categories: ['American', 'Fast Food'],
    description:
    'Late-night comfort food — burgers, stacks, and classic diner plates.',
    phone: '01 47 36 55 17',
    serviceModes: 'delivery'
  },
  'Bamboo Garden': {
    categories: ['Asian'],
    description:
    'Stir-fries, dumplings, and fragrant Asian noodles for everyday cravings.',
    phone: '01 48 62 19 43',
    serviceModes: 'delivery'
  },
  'Crêpe & Co': {
    categories: ['French'],
    description:
    'Sweet and savory crêpes, galettes, and Parisian street-food favorites.',
    phone: '01 42 08 77 25',
    serviceModes: 'pickup'
  },
  'Alpine Fondue': {
    categories: ['French'],
    description:
    'Melting cheese fondue, raclette, and alpine comfort dishes for sharing.',
    phone: '01 43 91 44 60',
    serviceModes: 'delivery'
  },
  'Taco Libre': {
    categories: ['Fast Food', 'American'],
    description:
    'Street-style tacos, burritos, and salsas with bold grilled flavors.',
    phone: '01 44 20 63 81',
    serviceModes: 'delivery'
  },
  'Golden Wok': {
    categories: ['Asian'],
    description:
    'Wok-fired classics, crispy rolls, and fragrant rice dishes done right.',
    phone: '01 45 57 28 14',
    serviceModes: 'delivery'
  },
  'Provence Plate': {
    categories: ['French', 'Mediterranean'],
    description:
    'Provençal herbs, olive oil, and sunny Mediterranean French cuisine.',
    phone: '01 46 39 05 72',
    serviceModes: 'delivery'
  },
  'Urban Pasta': {
    categories: ['Italian'],
    description:
    'Fresh pasta bowls, creamy sauces, and Italian street favorites.',
    phone: '01 47 81 16 39',
    serviceModes: 'delivery'
  },
  'Demo Kitchen': {
    categories: ['Pizza', 'American'],
    description:
    'Demo restaurant serving crowd-pleasing pizza, burgers, and everyday favorites.',
    phone: '01 48 00 12 34',
    serviceModes: 'delivery'
  },
  'Bercy Brasserie': {
    categories: ['French', 'Mediterranean'],
    description:
    'Modern brasserie near Bercy with French classics and Mediterranean sides.',
    phone: '01 42 66 90 18',
    serviceModes: 'delivery'
  }
};

function slugify(name) {
  return String(name || '').
  toLowerCase().
  replace(/[^a-z0-9]+/g, '-').
  replace(/^-|-$/g, '');
}

function round2(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100) / 100;
}

function frenchMobileFromIndex(index) {
  const base = 600000000 + index * 137 % 89999999;
  const digits = String(base).padStart(9, '0');
  return `06 ${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)}`;
}

function buildCategoryEntry(categoryDoc) {
  return {
    alias: slugify(categoryDoc.name),
    title: categoryDoc.name,
    image: categoryDoc.image || '',
    value: categoryDoc._id,
    label: categoryDoc.name
  };
}

function payoutMethodFor(type) {
  if (type === 'restaurant_payout' || type === 'driver_payout') return 'ach_deposit';
  return undefined;
}

function paymentMethodFor(type, current) {
  if (type === 'customer_payment' || type === 'customer_top_up' || type === 'tip') {
    return current && current !== 'not_applicable' ? current : 'credit_card';
  }
  if (type === 'refund') return current && current !== 'not_applicable' ? current : 'platform_credit';
  return undefined;
}

function statusFor(type, index) {
  if (type === 'refund') return index % 5 === 0 ? 'pending' : 'completed';
  if (index % 11 === 3) return 'pending';
  if (index % 17 === 5) return 'failed';
  return 'completed';
}

function amountFor(type, current, index) {
  const rounded = round2(current);
  switch (type) {
    case 'tip':
      return round2(2.5 + index % 7 * 1.25);
    case 'delivery_fee':
      return round2(2.99 + index % 4 * 0.5);
    case 'service_fee':
      return round2(1.49 + index % 3 * 0.25);
    case 'driver_payout':
      return round2(8 + index % 9 * 1.5);
    case 'restaurant_payout':
      return rounded > 5 && rounded < 400 ? rounded : round2(35 + index % 20 * 4.5);
    case 'platform_commission':
      return rounded > 1 && rounded < 80 ? rounded : round2(4.5 + index % 12 * 1.75);
    case 'customer_payment':
      return rounded > 5 && rounded < 250 ? rounded : round2(18 + index % 25 * 3.2);
    case 'customer_top_up':
      return [10, 20, 25, 50, 100][index % 5];
    case 'refund':
      return rounded > 1 && rounded < 120 ? rounded : round2(8 + index % 10 * 2);
    default:
      return rounded > 0 ? rounded : round2(12 + index % 8);
  }
}

async function up(db) {
  const now = new Date();
  const categoriesCol = db.collection('categories');
  const restaurantsCol = db.collection('restaurants');
  const productsCol = db.collection('products');
  const taxesCol = db.collection('taxes');
  const usersCol = db.collection('users');
  const transactionsCol = db.collection('transactions');

  const categories = await categoriesCol.find({}).toArray();
  const byName = new Map(categories.map((c) => [c.name, c]));
  if (!byName.size) {
    console.log('⚠️ Aucune catégorie — migration 31 ignorée');
    return;
  }

  let franceTax = await taxesCol.findOne({ location: 'France', name: 'VAT' });
  if (!franceTax) {
    franceTax = await taxesCol.findOne({ location: 'France' });
  }
  if (franceTax && Number(franceTax.rate) !== 20) {
    if (franceTax.migrationSeedKey !== SEED_KEY) {
      await taxesCol.updateOne(
        { _id: franceTax._id },
        {
          $set: {
            migrationSeedKey: SEED_KEY,
            migrationSeedPreviousRate: franceTax.rate,
            rate: 20,
            updatedAt: now
          }
        }
      );
      franceTax = { ...franceTax, rate: 20 };
      console.log('✅ Taxe France VAT → 20%');
    }
  }

  const restaurants = await restaurantsCol.find({}).toArray();
  let restaurantUpdated = 0;

  for (const restaurant of restaurants) {
    if (restaurant.migrationSeedKey === SEED_KEY) continue;

    const profile = RESTAURANT_PROFILES[restaurant.name] || {
      categories: ['French'],
      description: `${restaurant.name} serves freshly prepared meals for delivery and pickup.`,
      phone: '01 40 00 00 00',
      serviceModes: 'delivery'
    };

    const categoryNames = profile.categories.filter((name) => byName.has(name));
    const nextCategories = categoryNames.map((name) => buildCategoryEntry(byName.get(name)));
    if (!nextCategories.length) {
      const fallback = categories[0];
      nextCategories.push(buildCategoryEntry(fallback));
    }

    const taxPayload = franceTax ?
    {
      id: String(franceTax._id),
      location: franceTax.location || 'France',
      rate: String(franceTax.rate ?? 20),
      name: franceTax.name || 'VAT',
      value: franceTax._id,
      label: franceTax.name || 'VAT'
    } :
    restaurant.tax;

    await restaurantsCol.updateOne(
      { _id: restaurant._id },
      {
        $set: {
          migrationSeedKey: SEED_KEY,
          migrationSeedPrevious: {
            categories: restaurant.categories || [],
            description: restaurant.description || '',
            phone: restaurant.phone || '',
            display_phone: restaurant.display_phone || '',
            tax: restaurant.tax || null,
            serviceModes: restaurant.serviceModes,
            city: restaurant.city || '',
            country: restaurant.country || ''
          },
          categories: nextCategories,
          description: profile.description,
          phone: profile.phone,
          display_phone: profile.phone,
          tax: taxPayload,
          serviceModes: profile.serviceModes,
          city: restaurant.city || 'Paris',
          country: restaurant.country || 'France',
          isActivated: restaurant.isActivated !== false,
          updatedAt: now
        }
      }
    );
    restaurantUpdated += 1;
  }

  console.log(`✅ ${restaurantUpdated} restaurant(s) mis à jour`);

  const restaurantById = new Map(
    (await restaurantsCol.find({}).project({ name: 1, categories: 1 }).toArray()).map((r) => [
    String(r._id),
    r]
    )
  );

  const products = await productsCol.find({}).toArray();
  let productUpdated = 0;
  for (const product of products) {
    if (product.migrationSeedKey === SEED_KEY) continue;

    const restaurant = restaurantById.get(String(product.restaurant));
    const primaryCategory =
    restaurant?.categories?.[0]?.value ||
    byName.get('French')?._id ||
    categories[0]._id;

    const currentCatOk =
    product.category &&
    categories.some((c) => String(c._id) === String(product.category));

    if (currentCatOk && product.migrationSeedKey === SEED_KEY) continue;

    await productsCol.updateOne(
      { _id: product._id },
      {
        $set: {
          migrationSeedKey: SEED_KEY,
          migrationSeedPreviousCategory: product.category || null,
          category: currentCatOk ? product.category : primaryCategory,
          updatedAt: now
        }
      }
    );
    productUpdated += 1;
  }
  console.log(`✅ ${productUpdated} produit(s) catégorie alignée`);

  const customers = await usersCol.
  find({ role: 'customer' }).
  project({ phone: 1 }).
  toArray();
  let userUpdated = 0;
  for (let i = 0; i < customers.length; i += 1) {
    const user = customers[i];
    if (user.migrationSeedKey === SEED_KEY) continue;
    const nextPhone = frenchMobileFromIndex(i);
    await usersCol.updateOne(
      { _id: user._id },
      {
        $set: {
          migrationSeedKey: SEED_KEY,
          migrationSeedPreviousPhone: user.phone || '',
          phone: nextPhone,
          updatedAt: now
        }
      }
    );
    userUpdated += 1;
  }
  console.log(`✅ ${userUpdated} client(s) téléphone FR`);

  const transactions = await transactionsCol.find({}).toArray();
  let txUpdated = 0;
  for (let i = 0; i < transactions.length; i += 1) {
    const tx = transactions[i];
    if (tx.migrationSeedKey === SEED_KEY) continue;

    const type = tx.transaction_type;
    const amount = amountFor(type, tx.amount, i);
    const status = statusFor(type, i);
    const platformPct = 10;
    const platformAmount = round2(amount * (platformPct / 100));
    const processorAmount = round2(amount * 0.029 + 0.3);
    const taxAmount = round2(amount * 0.1);

    const payment_method = paymentMethodFor(type, tx.payment_method);
    const payout_method = payoutMethodFor(type);

    const $set = {
      migrationSeedKey: SEED_KEY,
      migrationSeedPrevious: {
        amount: tx.amount,
        status: tx.status,
        payment_method: tx.payment_method,
        payout_method: tx.payout_method,
        platform_fee: tx.platform_fee,
        processor_fee: tx.processor_fee,
        tax: tx.tax,
        date_completed: tx.date_completed,
        date_processed: tx.date_processed
      },
      amount,
      status,
      platform_fee: {
        amount: platformAmount,
        percentage: platformPct,
        description: 'Platform commission'
      },
      processor_fee: {
        amount: processorAmount,
        description: 'Payment processing fee'
      },
      tax: {
        amount: taxAmount,
        description: 'Sales tax'
      },
      updatedAt: now
    };

    if (payment_method) $set.payment_method = payment_method;else
    $set.payment_method = undefined;

    if (payout_method) $set.payout_method = payout_method;

    if (status === 'completed') {
      $set.date_processed = tx.date_processed || tx.date_created || now;
      $set.date_completed = tx.date_completed || tx.date_created || now;
    }

    const update = { $set };
    if (!payment_method) {
      update.$unset = { ...(update.$unset || {}), payment_method: '' };
      delete $set.payment_method;
    }
    if (!payout_method) {
      update.$unset = { ...(update.$unset || {}), payout_method: '' };
    }

    await transactionsCol.updateOne({ _id: tx._id }, update);
    txUpdated += 1;
  }
  console.log(`✅ ${txUpdated} transaction(s) cohérentes`);
}

async function down(db) {
  const restaurantsCol = db.collection('restaurants');
  const productsCol = db.collection('products');
  const taxesCol = db.collection('taxes');
  const usersCol = db.collection('users');
  const transactionsCol = db.collection('transactions');

  const restaurants = await restaurantsCol.find({ migrationSeedKey: SEED_KEY }).toArray();
  for (const restaurant of restaurants) {
    const prev = restaurant.migrationSeedPrevious || {};
    await restaurantsCol.updateOne(
      { _id: restaurant._id },
      {
        $set: {
          categories: prev.categories || [],
          description: prev.description || '',
          phone: prev.phone || '',
          display_phone: prev.display_phone || '',
          tax: prev.tax,
          serviceModes: prev.serviceModes,
          city: prev.city || '',
          country: prev.country || ''
        },
        $unset: {
          migrationSeedKey: '',
          migrationSeedPrevious: ''
        }
      }
    );
  }

  const products = await productsCol.find({ migrationSeedKey: SEED_KEY }).toArray();
  for (const product of products) {
    await productsCol.updateOne(
      { _id: product._id },
      {
        $set: {
          category: product.migrationSeedPreviousCategory || null
        },
        $unset: {
          migrationSeedKey: '',
          migrationSeedPreviousCategory: ''
        }
      }
    );
  }

  const taxes = await taxesCol.find({ migrationSeedKey: SEED_KEY }).toArray();
  for (const tax of taxes) {
    await taxesCol.updateOne(
      { _id: tax._id },
      {
        $set: { rate: tax.migrationSeedPreviousRate },
        $unset: {
          migrationSeedKey: '',
          migrationSeedPreviousRate: ''
        }
      }
    );
  }

  const users = await usersCol.find({ migrationSeedKey: SEED_KEY }).toArray();
  for (const user of users) {
    await usersCol.updateOne(
      { _id: user._id },
      {
        $set: { phone: user.migrationSeedPreviousPhone || '' },
        $unset: {
          migrationSeedKey: '',
          migrationSeedPreviousPhone: ''
        }
      }
    );
  }

  const transactions = await transactionsCol.find({ migrationSeedKey: SEED_KEY }).toArray();
  for (const tx of transactions) {
    const prev = tx.migrationSeedPrevious || {};
    await transactionsCol.updateOne(
      { _id: tx._id },
      {
        $set: {
          amount: prev.amount,
          status: prev.status,
          payment_method: prev.payment_method,
          payout_method: prev.payout_method,
          platform_fee: prev.platform_fee,
          processor_fee: prev.processor_fee,
          tax: prev.tax,
          date_completed: prev.date_completed,
          date_processed: prev.date_processed
        },
        $unset: {
          migrationSeedKey: '',
          migrationSeedPrevious: ''
        }
      }
    );
  }

  console.log(
    `↩️ Migration 31 annulée (restaurants=${restaurants.length}, products=${products.length}, users=${users.length}, txs=${transactions.length})`
  );
}

module.exports = {
  SEED_KEY,
  RESTAURANT_PROFILES,
  up,
  down
};
