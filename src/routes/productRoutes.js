const express = require("express");
const productController = require("../controllers/productController");

const router = express.Router();

router.get("/", productController.getAll);
router.get("/:id", productController.getById);
router.post("/", productController.create);
router.put("/:id", productController.update);
router.delete("/:id", productController.delete);

router.get("/schema", productController.getSchema);
router.get("/defaultFields", productController.getDefaultFields);

module.exports = router;

