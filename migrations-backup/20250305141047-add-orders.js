const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');
module.exports = {
  async up(db) {
    try {
      await db.collection("orders").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    const [users, restaurants, drivers, products, menus] = await Promise.all([
      db.collection('users').find({}).project({ _id: 1, name: 1 }).toArray(),
      db.collection('restaurants').find({}).project({ _id: 1, name: 1 }).toArray(),
      db.collection('drivers').find({}).project({ _id: 1, name: 1 }).toArray(),
      db.collection('products').find({}).project({ _id: 1, name: 1, price: 1 }).toArray(),
      db.collection('menus').find({}).project({ _id: 1, name: 1, price: 1, image: 1 }).toArray()
    ]);
    if (!users.length || !restaurants.length) {
      return;
    }
    const mockOrders = Array.from({ length: 50 }, (_, i) => {
      const user = faker.helpers.arrayElement(users);
      const restaurant = faker.helpers.arrayElement(restaurants);
      const driver = drivers.length > 0 ? faker.helpers.arrayElement(drivers) : null;
      const items = Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => {
        let item, isMenu;
        if (menus.length > 0 && products.length > 0) {
          isMenu = faker.datatype.boolean({ probability: 0.6 });
          item = isMenu ? faker.helpers.arrayElement(menus) : faker.helpers.arrayElement(products);
        } else if (menus.length > 0) {
          isMenu = true;
          item = faker.helpers.arrayElement(menus);
        } else if (products.length > 0) {
          isMenu = false;
          item = faker.helpers.arrayElement(products);
        } else {
          return null;
        }
        const quantity = faker.number.int({ min: 1, max: 3 });
        const basePrice = isMenu ? item.price : item.price;
        const itemTotal = basePrice * quantity;
        const extras = products.length > 0 ? Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => {
          const product = faker.helpers.arrayElement(products);
          const extraQuantity = faker.number.int({ min: 1, max: 2 });
          return {
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: extraQuantity
          };
        }) : [];
        const variants = Array.from({ length: faker.number.int({ min: 0, max: 2 }) }, () => ({
          name: faker.commerce.productAdjective(),
          price: faker.number.float({ min: 1, max: 5, precision: 0.5 }),
          extra: faker.number.float({ min: 0, max: 3, precision: 0.5 }),
          size: faker.helpers.arrayElement(['S', 'M', 'L', 'XL'])
        }));
        const extrasTotal = extras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0);
        const variantsTotal = variants.reduce((sum, variant) => sum + variant.price, 0);
        const total = itemTotal + extrasTotal + variantsTotal;
        return {
          type: isMenu ? 'Menu' : 'Product',
          item: item._id,
          name: item.name,
          image: item.image || faker.image.urlLoremFlickr({ category: 'food' }),
          price: basePrice,
          currency: 'USD',
          quantity,
          extras,
          variants,
          total
        };
      });
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const taxRate = 0.18; 
      const taxAmount = subtotal * taxRate;
      const deliveryFee = faker.number.float({ min: 500, max: 2000, precision: 100 });
      const totalPrice = subtotal + taxAmount + deliveryFee;
      const status = faker.helpers.arrayElement([
        'pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'
      ]);
      return {
        user: user._id,
        restaurant: restaurant._id,
        driver: driver._id,
        items,
        totalPrice,
        subtotal,
        tax: {
          rate: taxRate,
          amount: taxAmount
        },
        status,
        payment: {
          method: faker.helpers.arrayElement(['credit_card', 'mobile_money', 'cash']),
          status: status === 'cancelled' ? 'failed' : 
                 ['delivered', 'out_for_delivery'].includes(status) ? 'paid' : 'pending',
          transactionId: faker.string.uuid()
        },
        delivery: {
          type: faker.helpers.arrayElement(['delivery', 'pickup']),
          address: faker.location.streetAddress(),
          estimatedTime: faker.date.soon({ days: 1 }),
          deliveryFee: deliveryFee
        },
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent({ days: 30 })
      };
    }).filter(order => order.items && order.items.length > 0); 
    if (mockOrders.length === 0) {
      return;
    }
    await db.collection('orders').insertMany(mockOrders);
  },
  async down(db) {
    await db.collection('orders').deleteMany({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};
