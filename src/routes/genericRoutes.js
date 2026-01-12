const express = require("express");
const genericController = require("../controllers/genericController");
const convertToModelName = require("../utils/convertToModelName");
const Tax = require("../models/Tax");
const { populateSelectFields } = require("../utils/populateSelectFields");

const router = express.Router();

// Middleware pour récupérer dynamiquement le bon modèle
router.use("/:model", async (req, res, next) => {
  // Log spécifique pour restaurants
  // if (req.params.model === 'restaurants') {
  //   console.log(`🍽️ RESTAURANTS: Request received for /resource/restaurants`);
  // }

  // Log spécifique pour deliverysettings
  // if (req.params.model === 'deliverysettings') {
  //   console.log(`🔥 DELIVERY SETTINGS BACKEND: Request received for /resource/deliverysettings`);
  // }

  const modelName = convertToModelName(req.params.model); // Conversion dynamique

  // if (req.params.model === 'restaurants') {
  //   console.log(`🍽️ RESTAURANTS: Converting 'restaurants' to '${modelName}'`);
  // }

  // if (req.params.model === 'deliverysettings') {
  //   console.log(`🔥 DELIVERY SETTINGS BACKEND: Converting 'deliverysettings' to '${modelName}'`);
  // }

  try {
    req.Model = require(`../models/${modelName}`); // Importation dynamique du modèle

    // if (req.params.model === 'restaurants') {
    //   console.log(`✅ RESTAURANTS: Model '${modelName}' loaded successfully`);
    // }

    // if (req.params.model === 'deliverysettings') {
    //   console.log(`✅ DELIVERY SETTINGS BACKEND: Model '${modelName}' loaded successfully`);
    // }

    next();
  } catch (error) {
    // if (req.params.model === 'restaurants') {
    //   console.error(`🍽️ RESTAURANTS ERROR: Failed to load model '${modelName}':`, error.message);
    // }

    // if (req.params.model === 'deliverysettings') {
    //   console.error(`❌ DELIVERY SETTINGS BACKEND ERROR: Failed to load model '${modelName}':`, error.message);
    //   console.error(`❌ DELIVERY SETTINGS BACKEND ERROR: Looking for file: ${modelName}.js`);
    // }
    return res.status(400).json({
      error: `Invalid model name: ${modelName}`,
      details: error.message,
      requested: req.params.model
    });
  }
});

router.get("/:model/defaultFields", (req, res) =>
  genericController(req.Model).getDefaultFields(req, res)
);

router.get("/:model/schema", (req, res) => 
  genericController(req.Model).getSchema(req, res)
);

router.get("/:model", (req, res) =>
  genericController(req.Model).getAll(req, res)
);
router.get("/:model/:id", (req, res) =>
  genericController(req.Model).getById(req, res)
);
router.post("/:model", (req, res) =>
  genericController(req.Model).create(req, res)
);
router.put("/:model/:id", (req, res) =>
  genericController(req.Model).update(req, res)
);
router.delete("/:model/:id", (req, res) =>
  genericController(req.Model).delete(req, res)
);

module.exports = router;
