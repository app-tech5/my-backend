const express = require("express");
const genericController = require("../controllers/genericController");
const convertToModelName = require("../utils/convertToModelName");
const Tax = require("../models/Tax");
const { populateSelectFields } = require("../utils/populateSelectFields");

const router = express.Router();

// Middleware pour récupérer dynamiquement le bon modèle
router.use("/:model", async (req, res, next) => {
  console.log(req.params.model);
  const modelName = convertToModelName(req.params.model); // Conversion dynamique
  console.log("Requested model:", modelName);

  try {
    req.Model = require(`../models/${modelName}`); // Importation dynamique du modèle

    // await populateSelectFields(req.body);

    // if (modelName === "Restaurant") {
    //   const { tax } = req.body;
    //   if (tax && tax.value) {
    //     const taxExists = await Tax.findById(tax.value);
    //     if (!taxExists) {
    //       return res.status(400).json({ error: "Invalid tax ID" });
    //     }
    //     req.body.tax = taxExists; 
    //   }
    // }

    next();
  } catch (error) {
    return res.status(400).json({ error: "Invalid model name" });
  }
});

router.get("/:model/defaultFields", (req, res) =>
  genericController(req.Model).getDefaultFields(req, res)
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
