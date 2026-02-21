const express = require("express");
const genericController = require("../controllers/genericController");
const convertToModelName = require("../utils/convertToModelName");
const Tax = require("../models/Tax");
const { populateSelectFields } = require("../utils/populateSelectFields");
const router = express.Router();
router.use("/:model", async (req, res, next) => {
  const modelName = convertToModelName(req.params.model); 
  try {
    req.Model = require(`../models/${modelName}`); 
    next();
  } catch (error) {
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
