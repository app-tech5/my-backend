const genericController = require('./genericController');
const Product = require('../models/Product');

const productController = {
  ...genericController(Product),
  
  getAll: async (req, res) => {
    try {
      const items = await Product.find().setOptions({ queryParams: req.query });

      const filteredItems = items.filter(product => {
        return product.image &&
               product.image.trim() !== '' &&
               product.image !== null &&
               product.image !== undefined;
      });

      res.json(filteredItems);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = productController;

