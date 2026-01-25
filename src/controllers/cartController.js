const Cart = require("../models/Cart");

const cartController = {
  // Récupérer le panier de l'utilisateur
  getCart: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      let cart = await Cart.findByUser(userId);

      // Si pas de panier, en créer un vide
      if (!cart) {
        cart = new Cart({
          user: userId,
          items: [],
          deviceId: req.headers['x-device-id'],
          sessionId: req.headers['x-session-id']
        });
        await cart.save();
      }

      res.json({
        _id: cart._id,
        user: cart.user,
        items: cart.items,
        itemCount: cart.getItemCount(),
        total: cart.getTotal(),
        lastModified: cart.lastModified
      });
    } catch (error) {
      console.error("Error getting cart:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Ajouter un item au panier
  addItem: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const itemData = req.body;

      let cart = await Cart.findByUser(userId);

      // Créer le panier s'il n'existe pas
      if (!cart) {
        cart = new Cart({
          user: userId,
          items: [],
          deviceId: req.headers['x-device-id'],
          sessionId: req.headers['x-session-id']
        });
      }

      // Ajouter l'item
      await cart.addItem(itemData);

      res.json({
        _id: cart._id,
        user: cart.user,
        items: cart.items,
        itemCount: cart.getItemCount(),
        total: cart.getTotal(),
        lastModified: cart.lastModified
      });
    } catch (error) {
      console.error("Error adding item to cart:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Supprimer un item du panier
  removeItem: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { uniqueKey } = req.params;

      const cart = await Cart.findByUser(userId);
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      await cart.removeItem(uniqueKey);

      res.json({
        _id: cart._id,
        user: cart.user,
        items: cart.items,
        itemCount: cart.getItemCount(),
        total: cart.getTotal(),
        lastModified: cart.lastModified
      });
    } catch (error) {
      console.error("Error removing item from cart:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Mettre à jour un item du panier
  updateItem: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { uniqueKey } = req.params;
      const itemData = req.body;

      const cart = await Cart.findByUser(userId);
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      await cart.updateItem(uniqueKey, itemData);

      res.json({
        _id: cart._id,
        user: cart.user,
        items: cart.items,
        itemCount: cart.getItemCount(),
        total: cart.getTotal(),
        lastModified: cart.lastModified
      });
    } catch (error) {
      console.error("Error updating item in cart:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Vider le panier pour un restaurant spécifique
  clearRestaurant: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { restaurantName } = req.params;

      const cart = await Cart.findByUser(userId);
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      await cart.clearRestaurant(restaurantName);

      res.json({
        _id: cart._id,
        user: cart.user,
        items: cart.items,
        itemCount: cart.getItemCount(),
        total: cart.getTotal(),
        lastModified: cart.lastModified
      });
    } catch (error) {
      console.error("Error clearing restaurant from cart:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Vider complètement le panier
  clearCart: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const cart = await Cart.findByUser(userId);
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      await cart.clear();

      res.json({
        _id: cart._id,
        user: cart.user,
        items: cart.items,
        itemCount: cart.getItemCount(),
        total: cart.getTotal(),
        lastModified: cart.lastModified
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Synchroniser le panier (pour fusionner avec le panier local)
  syncCart: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { localItems } = req.body; // Items du panier local à fusionner

      let cart = await Cart.findByUser(userId);

      // Créer le panier s'il n'existe pas
      if (!cart) {
        cart = new Cart({
          user: userId,
          items: [],
          deviceId: req.headers['x-device-id'],
          sessionId: req.headers['x-session-id']
        });
      }

      // Fusionner les items locaux avec le panier serveur
      if (localItems && Array.isArray(localItems)) {
        for (const localItem of localItems) {
          const existingItemIndex = cart.items.findIndex(item =>
            item.uniqueKey === localItem.uniqueKey
          );

          if (existingItemIndex >= 0) {
            // Si l'item existe, prendre la quantité maximale
            cart.items[existingItemIndex].quantity = Math.max(
              cart.items[existingItemIndex].quantity,
              localItem.quantity || 1
            );
            cart.items[existingItemIndex].totalPrice = cart.items[existingItemIndex].quantity * cart.items[existingItemIndex].price;
          } else {
            // Sinon, ajouter le nouvel item
            cart.items.push(localItem);
          }
        }
      }

      await cart.save();

      res.json({
        _id: cart._id,
        user: cart.user,
        items: cart.items,
        itemCount: cart.getItemCount(),
        total: cart.getTotal(),
        lastModified: cart.lastModified
      });
    } catch (error) {
      console.error("Error syncing cart:", error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = cartController;
