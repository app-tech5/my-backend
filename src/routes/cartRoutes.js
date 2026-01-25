const express = require("express");
const cartController = require("../controllers/cartController");

const router = express.Router();

// Toutes les routes du panier nécessitent une authentification

// Routes du panier
router.get("/", cartController.getCart);
router.post("/items", cartController.addItem);
router.delete("/items/:uniqueKey", cartController.removeItem);
router.put("/items/:uniqueKey", cartController.updateItem);
router.delete("/restaurant/:restaurantName", cartController.clearRestaurant);
router.delete("/", cartController.clearCart);
router.post("/sync", cartController.syncCart);

module.exports = router;
