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

      // Corriger les items qui n'ont pas d'id
      cart.items = cart.items.map(item => {
        if (!item.id) {
          item.id = item._id || item.uniqueKey || `item_${Date.now()}_${Math.random()}`;
        }
        return item;
      });

      // Sauvegarder si des corrections ont été faites
      if (cart.isModified()) {
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

      // Validation des données requises
      if (!itemData.name || !itemData.image || !itemData.price) {
        throw new Error('Item data is incomplete: name, image, and price are required');
      }

      // Préparer l'item avec les champs requis
      const itemId = itemData.id || itemData._id || itemData.uniqueKey || `item_${Date.now()}_${Math.random()}`;

      const preparedItem = {
        id: itemId,
        name: itemData.name,
        image: itemData.image,
        price: itemData.price,
        currency: itemData.currency || 'EUR',
        quantity: itemData.quantity || 1,
        totalPrice: itemData.totalPrice || itemData.price,
        uniqueKey: itemData.uniqueKey || itemId,
        restaurantName: itemData.restaurantName,
        restaurantImage: itemData.restaurantImage,
        extras: itemData.extras || [],
        variants: itemData.variants || [],
        addedAt: new Date()
      };

      // Ajouter les références si disponibles
      if (itemData.restaurant && itemData.restaurant._id) {
        preparedItem.restaurant = itemData.restaurant._id;
      }

      // Déterminer le type d'item si possible
      if (itemData.itemType) {
        preparedItem.itemType = itemData.itemType;
        preparedItem.item = itemData.item;
      }

      // Ajouter l'item
      await cart.addItem(preparedItem);

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

      const { itemId } = req.params; // Redux envoie l'ID de l'item

      const cart = await Cart.findByUser(userId);
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      await cart.removeItem(itemId);

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

      const { itemId } = req.params; // Redux envoie l'ID de l'item
      const itemData = req.body;

      const cart = await Cart.findByUser(userId);
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      await cart.updateItem(itemId, itemData);

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
            cart.items[existingItemIndex].totalPrice = cart.items[existingItemIndex].quantity * (cart.items[existingItemIndex].price || 0);
          } else {
            // Validation des données requises
            if (!localItem.name || !localItem.image || !localItem.price) {
              console.warn('Skipping invalid item in sync:', localItem);
              return; // Skip invalid items
            }

            // Préparer l'item pour le backend
            const itemId = localItem.id || localItem._id || localItem.uniqueKey || `item_${Date.now()}_${Math.random()}`;

            const preparedItem = {
              id: itemId,
              name: localItem.name,
              image: localItem.image,
              price: localItem.price,
              currency: localItem.currency || 'EUR',
              quantity: localItem.quantity || 1,
              totalPrice: localItem.totalPrice || localItem.price,
              uniqueKey: localItem.uniqueKey || itemId,
              restaurantName: localItem.restaurantName,
              restaurantImage: localItem.restaurantImage,
              extras: localItem.extras || [],
              variants: localItem.variants || []
            };

            if (localItem.restaurant && localItem.restaurant._id) {
              preparedItem.restaurant = localItem.restaurant._id;
            }

            if (localItem.itemType) {
              preparedItem.itemType = localItem.itemType;
              preparedItem.item = localItem.item;
            }

            cart.items.push(preparedItem);
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
