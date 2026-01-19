const genericController = require('./genericController');
const Product = require('../models/Product');

const productController = {
  ...genericController(Product),

  // Override getAll to filter products with valid images
  getAll: async (req, res) => {
    try {
      console.log("Requête reçue pour les produits avec query params:");
      const items = await Product.find().setOptions({ queryParams: req.query });

      // Filter out products without valid images
      const filteredItems = items.filter(product => {
        return product.image &&
               product.image.trim() !== '' &&
               product.image !== null &&
               product.image !== undefined;
      });

      console.log(`Filtered ${items.length - filteredItems.length} products without valid images`);

      res.json(filteredItems);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = productController;



