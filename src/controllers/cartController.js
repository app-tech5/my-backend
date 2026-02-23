const Cart = require("../models/Cart");
const i18n = require('../config/i18n');
const cartController = {
  getCart: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: i18n.__("authentication_required") });
      }
      let cart = await Cart.findByUser(userId);
      if (!cart) {
        cart = new Cart({
          user: userId,
          items: [],
          deviceId: req.headers['x-device-id'],
          sessionId: req.headers['x-session-id']
        });
        await cart.save();
      }
      cart.items = cart.items.map(item => {
        if (!item.id) {
          item.id = item._id || item.uniqueKey || `item_${Date.now()}_${Math.random()}`;
        }
        return item;
      });
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
      console.error(i18n.__("error_getting_cart"), error);
      res.status(500).json({ error: error.message });
    }
  },
  addItem: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: i18n.__("authentication_required") });
      }
      const itemData = req.body;
      let cart = await Cart.findByUser(userId);
      if (!cart) {
        cart = new Cart({
          user: userId,
          items: [],
          deviceId: req.headers['x-device-id'],
          sessionId: req.headers['x-session-id']
        });
      }
      if (!itemData.name || !itemData.image || !itemData.price) {
        throw new Error('Item data is incomplete: name, image, and price are required');
      }
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
      if (itemData.restaurant && itemData.restaurant._id) {
        preparedItem.restaurant = itemData.restaurant._id;
      }
      if (itemData.itemType) {
        preparedItem.itemType = itemData.itemType;
        preparedItem.item = itemData.item;
      }
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
  removeItem: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: i18n.__("authentication_required") });
      }
      const { itemId } = req.params; 
      const cart = await Cart.findByUser(userId);
      if (!cart) {
        return res.status(404).json({ message: i18n.__("cart_not_found") });
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
  updateItem: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: i18n.__("authentication_required") });
      }
      const { itemId } = req.params; 
      const itemData = req.body;
      const cart = await Cart.findByUser(userId);
      if (!cart) {
        return res.status(404).json({ message: i18n.__("cart_not_found") });
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
  clearRestaurant: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: i18n.__("authentication_required") });
      }
      const { restaurantName } = req.params;
      const cart = await Cart.findByUser(userId);
      if (!cart) {
        return res.status(404).json({ message: i18n.__("cart_not_found") });
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
  clearCart: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: i18n.__("authentication_required") });
      }
      const cart = await Cart.findByUser(userId);
      if (!cart) {
        return res.status(404).json({ message: i18n.__("cart_not_found") });
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
  syncCart: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: i18n.__("authentication_required") });
      }
      const { localItems } = req.body; 
      let cart = await Cart.findByUser(userId);
      if (!cart) {
        cart = new Cart({
          user: userId,
          items: [],
          deviceId: req.headers['x-device-id'],
          sessionId: req.headers['x-session-id']
        });
      }
      if (localItems && Array.isArray(localItems)) {
        for (const localItem of localItems) {
          const existingItemIndex = cart.items.findIndex(item =>
            item.uniqueKey === localItem.uniqueKey
          );
          if (existingItemIndex >= 0) {
            cart.items[existingItemIndex].quantity = Math.max(
              cart.items[existingItemIndex].quantity,
              localItem.quantity || 1
            );
            cart.items[existingItemIndex].totalPrice = cart.items[existingItemIndex].quantity * (cart.items[existingItemIndex].price || 0);
          } else {
            if (!localItem.name || !localItem.image || !localItem.price) {
              console.warn('Skipping invalid item in sync:', localItem);
              return; 
            }
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
