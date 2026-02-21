const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');
module.exports = {
  async up(db, client) {
    try {
      await db.collection("variants").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    const mockVariants = [];
    const variantNames = [
      "Double Steak", 
      "Grilled Chicken",
      "Crispy Chicken",
      "Pulled Pork",
      "Bacon",
      "Pepperoni",
      "Sausage",
      "Tofu",
      "Halloumi",
      "Falafel",
      "Extra Cheese",
      "Mozzarella",
      "Cheddar",
      "Blue Cheese",
      "Feta",
      "Parmesan",
      "Goat Cheese",
      "Avocado",
      "Mushrooms",
      "Roasted Peppers",
      "Grilled Zucchini",
      "Eggplant",
      "Spinach",
      "Arugula",
      "Sun-Dried Tomatoes",
      "Jalapeños",
      "Pickles",
      "Onions",
      "Caramelized Onions",
      "Extra Sauce",
      "BBQ Sauce",
      "Garlic Sauce",
      "Truffle Mayo",
      "Spicy Mayo",
      "Pesto",
      "Tzatziki",
      "Sriracha",
      "Spicy",
      "Gluten Free",
      "Vegan Option",
      "Keto Friendly",
      "Low Carb",
      "Dairy Free",
      "Large Size",
      "Mini Size",
      "Family Size",
      "Fried Egg",
      "Guacamole",
      "Hummus",
      "Olives",
      "Pineapple",
      "Corn",
      "Black Beans",
      "Whole Wheat",
      "Sourdough",
      "Thin Crust",
      "Deep Dish"
    ];
    for (let i = 0; i < 50; i++) {
      const basePrice = faker.number.float({ min: 1, max: 15, precision: 0.01 });
      const extraPrice = faker.number.float({ min: 0.5, max: 5, precision: 0.01 });
      mockVariants.push({
        name: variantNames[i] || faker.commerce.productAdjective(),
        price: basePrice + extraPrice,
        extra: extraPrice.toFixed(2),
        available: faker.datatype.boolean(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    await db.collection('variants').insertMany(mockVariants);
  },
  async down(db, client) {
    await Variant.deleteMany({
      name: {
        $in: [
          "Double Steak", "Extra Cheese", "Bacon", "Avocado", "Mushrooms",
          "Extra Sauce", "Spicy", "Gluten Free", "Vegan Option", "Large Size"
        ]
      }
    });
  }
};
