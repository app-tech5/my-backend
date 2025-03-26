const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, default: "" },
  description: { type: String, required: true, default: "" },
  price: { type: Number, required: true, default: 0 },
  currency: { type: String, required: true, select: false, default: "EUR" }, // ou une autre devise par défaut
  image: { type: String, required: true, default: "" },
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category',  // Référence à la collection 'categories'
    required: true 
  }, // ou une catégorie par défaut
  categories: { type: Object, default: { value: "", label: "" } },
  restaurant: { type: mongoose.Schema.Types.ObjectId, required: true }, // Pas de valeur par défaut possible car ObjectId
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
    } 
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
    } 
  },
  variants: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      extra: { type: Number, required: true },
      value: { type: String, required: true },
      label: { type: String, required: true },
    }
  ],
  created_at: { type: Date, required: true },
  updated_at: { type: Date, required: true }
});

// ProductSchema.pre("findOne", function () {
//   this.populate({
//       path: "restaurant",
//       select: "name"
//   })
// });

ProductSchema.pre("findOne", function () {
  this.populate([
    {
      path: "restaurant",
      select: "name"  // On ne récupère que le nom du restaurant
    },
    {
      path: "category",
      select: "name"  // On suppose que votre modèle Category a un champ "name"
    }
  ]);
});

ProductSchema.pre("find", function () {
  this.populate({
    path: "restaurant",
    select: "name"
  });
});


const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;