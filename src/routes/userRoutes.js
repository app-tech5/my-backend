const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PaymentMethod = require('../models/PaymentMethod');
const i18n = require('../config/i18n');
const router = express.Router();
router.use(i18n.init);
router.post('/signup', async (req, res) => {
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: res.__("email_and_password_required") });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({errorType: "email", message: res.__("user_not_found") });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({errorType: "password", message: res.__("incorrect_password") });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'Strict' });
        return res.json({ message: res.__("login_successful"), token, user });
    } catch (error) {
        res.status(500).json({ message: res.__("server_error") });
    }
});
router.get('/me', async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); 
        if (!user) return res.status(401).json({ message: res.__("user_not_found") });
        res.json(user);
    } catch (error) {
        res.status(401).json({ message: res.__("invalid_or_expired_token") });
    }
});
router.put('/me', async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(401).json({ message: res.__("user_not_found") });
        }
        const { name, phone, address, image } = req.body;
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (image) user.image = image;
        const updatedUser = await user.save();
        const userWithoutPassword = updatedUser.toObject();
        delete userWithoutPassword.password;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error(i18n.__('update_error'), error);
        res.status(400).json({ 
            message: res.__("update_error"),
            error: error.message 
        });
    }
});
router.post("/logout", (req, res) => {
    res.clearCookie("token", { httpOnly: true, secure: false, sameSite: "Strict" });
    res.json({ message: res.__("logout_successful") });
});
router.post('/favorites/:restaurantId', async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: res.__("user_not_found") });
        }
        const restaurantId = req.params.restaurantId;
        if (user.favorites.includes(restaurantId)) {
            return res.status(400).json({ message: res.__("restaurant_already_in_favorites") });
        }
        user.favorites.push(restaurantId);
        await user.save();
        const updatedUser = await User.findById(req.user.id).populate('favorites');
        res.json({
            success: true,
            favorites: updatedUser.favorites,
            message: res.__("restaurant_added_to_favorites")
        });
    } catch (error) {
        console.error(i18n.__('add_to_favorites_error'), error);
        res.status(500).json({ message: res.__("server_error") });
    }
});
router.delete('/favorites/:restaurantId', async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: res.__("user_not_found") });
        }
        const restaurantId = req.params.restaurantId;
        user.favorites = user.favorites.filter(id => id.toString() !== restaurantId);
        await user.save();
        const updatedUser = await User.findById(req.user.id).populate('favorites');
        res.json({
            success: true,
            favorites: updatedUser.favorites,
            message: res.__("restaurant_removed_from_favorites")
        });
    } catch (error) {
        console.error(i18n.__('remove_from_favorites_error'), error);
        res.status(500).json({ message: res.__("server_error") });
    }
});
router.get('/favorites', async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('favorites');
        if (!user) {
            return res.status(404).json({ message: res.__("user_not_found") });
        }
        res.json({
            success: true,
            favorites: user.favorites
        });
    } catch (error) {
        console.error(i18n.__('get_favorites_error'), error);
        res.status(500).json({ message: res.__("server_error") });
    }
});
router.get('/:userId/addresses', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: res.__('user_not_found') });
        }
        const addresses = [];
        if (user.address) {
            addresses.push({
                id: 'user_default',
                type: 'home',
                name: 'My Address',
                address: user.address,
                city: '',
                postalCode: '',
                country: 'France',
                isDefault: true,
                coordinates: user.location ? {
                    lat: user.location.latitude,
                    lng: user.location.longitude
                } : null
            });
        }
        res.json(addresses);
    } catch (error) {
        console.error(i18n.__('get_addresses_error'), error);
        res.status(500).json({ message: res.__('server_error') });
    }
});
router.get('/:userId/payment-methods', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: res.__('user_not_found') });
        }
        const paymentMethods = await PaymentMethod.find({ user: userId, isActive: true });
        res.json(paymentMethods);
    } catch (error) {
        console.error(i18n.__('get_payment_methods_error'), error);
        res.status(500).json({ message: res.__('server_error') });
    }
});
router.post('/:userId/payment-methods', async (req, res) => {
    try {
        const userId = req.params.userId;
        const paymentData = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: res.__('user_not_found') });
        }
        if (paymentData.isDefault) {
            await PaymentMethod.updateMany(
                { user: userId },
                { $set: { isDefault: false } }
            );
        }
        const paymentMethod = new PaymentMethod({
            ...paymentData,
            user: userId
        });
        await paymentMethod.save();
        res.status(201).json({
            success: true,
            paymentMethod,
            message: res.__('payment_method_added_successfully')
        });
    } catch (error) {
        console.error(i18n.__('add_payment_method_error'), error);
        res.status(500).json({ message: res.__('server_error') });
    }
});
router.delete('/:userId/payment-methods/:paymentMethodId', async (req, res) => {
    try {
        const { userId, paymentMethodId } = req.params;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: res.__('user_not_found') });
        }
        const paymentMethod = await PaymentMethod.findOneAndDelete({
            _id: paymentMethodId,
            user: userId
        });
        if (!paymentMethod) {
            return res.status(404).json({ message: res.__('payment_method_not_found') });
        }
        res.json({
            success: true,
            message: res.__('payment_method_deleted_successfully')
        });
    } catch (error) {
        console.error(i18n.__('delete_payment_method_error'), error);
        res.status(500).json({ message: res.__('server_error') });
    }
});
router.put('/:userId/payment-methods/:paymentMethodId/default', async (req, res) => {
    try {
        const { userId, paymentMethodId } = req.params;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: res.__('user_not_found') });
        }
        await PaymentMethod.updateMany(
            { user: userId },
            { $set: { isDefault: false } }
        );
        const paymentMethod = await PaymentMethod.findOneAndUpdate(
            { _id: paymentMethodId, user: userId },
            { $set: { isDefault: true } },
            { new: true }
        );
        if (!paymentMethod) {
            return res.status(404).json({ message: res.__('payment_method_not_found') });
        }
        res.json({
            success: true,
            paymentMethod,
            message: res.__('payment_method_set_as_default_successfully')
        });
    } catch (error) {
        console.error(i18n.__('set_default_payment_method_error'), error);
        res.status(500).json({ message: res.__('server_error') });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: res.__("user_not_found") });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: res.__("server_error") });
    }
});
module.exports = router;
