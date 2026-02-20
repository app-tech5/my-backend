const express = require("express");
const cartController = require("../controllers/cartController");

const router = express.Router();

router.get("/", cartController.getCart);
router.post("/items", cartController.addItem);
router.delete("/items/:itemId", cartController.removeItem);
router.put("/items/:itemId", cartController.updateItem);
router.delete("/restaurant/:restaurantName", cartController.clearRestaurant);
router.delete("/", cartController.clearCart);
router.post("/sync", cartController.syncCart);

module.exports = router;
