const mongoose = require("mongoose");
const pluralize = require("pluralize");
const applyTransformHooks = require("../utils/applyTransformHooks");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, default: "" },
  description: { type: String, required: true, default: "" },
  price: { type: Number, required: true, default: 0 },
  currency: { type: String, select: false }, // ou une autre devise par défaut
  image: { type: String, required: true, default: "" },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category", // Référence à la collection 'categories'
    required: true,
    default: new mongoose.Types.ObjectId()
  }, // ou une catégorie par défaut
  categories: { type: Object, default: { value: "", label: "" } },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
    default: new mongoose.Types.ObjectId()
  }, // Pas de valeur par défaut possible car ObjectId
  restaurants: { type: Object, default: { value: "", label: "" } },
  availability: { type: Boolean, required: true, default: false },
  preparation_time: { type: Number, required: true, default: 0 }, // en minutes
  tags: { type: [String], required: true, select: false, default: [] },
  ingredients: { type: [String], required: true, default: [] },
  discount: {
    type: Object,
    default: {
      // Vous devez définir les valeurs par défaut selon la structure de votre discountSchema
      isActive: false,
      percentage: 0,
      // etc.
    },
  },
  rating: {
    // average: { type: Number, default: 0 },
    // count: { type: Number, default: 0 },
    type: Object,
    default: {
      // Vous devez définir les valeurs par défaut selon la structure de votre ratingSchema
      average: 0,
      count: 0,
      // etc.
    },
  },
  variants: [{
    value: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', default: null},
    label: { type: String, required: true, default: "" }
  }],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// ProductSchema.pre("findOne", function () {
//   this.populate({
//       path: "restaurant",
//       select: "name"
//   })
// });

// function transformUsersField(doc) {
//   doc.userId = doc.users.value;
//   doc.users = {
//     value: doc.users.value,
//     label: doc.users.label,
//   };
//   doc.updatedAt = Date.now();
// }
// DriverSchema.pre("save", function (next) {
//   transformUsersField(this);
//   next();
// });

// DriverSchema.pre("findOneAndUpdate", function (next) {
//   const update = this.getUpdate();
//   console.log(update);
//   transformUsersField(update);
//   // this.setUpdate(update);
//   next();
// });

// function transformReferencedFields(doc) {
//   const fields = ["restaurants", "categories"];

//   fields.forEach((field) => {
//     if (doc[field] && doc[field].value) {
//       const singularField = pluralize.singular(field); // "restaurants" -> "restaurant", "categories" -> "category"

//       doc[singularField] = doc[field].value;
//       doc[field] = { value: doc[field].value, label: doc[field].label };
//     }
//   });

//   doc.updatedAt = Date.now();
// }

// ProductSchema.pre("save", function (next) {
//   transformReferencedFields(this);
//   next();
// });

// ProductSchema.pre("findOneAndUpdate", function (next) {
//   const update = this.getUpdate();
//   if (update) {
//     transformReferencedFields(update);
//   }
//   next();
// });

applyTransformHooks(ProductSchema, ["restaurants", "categories"]);

ProductSchema.pre("findOne", function () {
  this.populate([
    {
      path: "restaurant",
      select: "name", // On ne récupère que le nom du restaurant
    },
    {
      path: "category",
      select: "name", // On suppose que votre modèle Category a un champ "name"
    },
  ]);
});

ProductSchema.pre("find", function () {
  const { queryParams } = this.options;

  // 🧠 Filtrage par restaurant si 'type' est passé
  if (queryParams?.type) {
    this.where({ restaurant: queryParams.type });
  }

  // 🧠 Populate des relations
  this.populate([
    {
      path: "restaurant",
      select: "name", // On ne récupère que le nom du restaurant
    },
    {
      path: "category",
      select: "name", // Idem pour la catégorie
    },
  ]);
});


const Product = mongoose.model("Product", ProductSchema);

module.exports = Product;
