const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const i18n = require('../config/i18n');
const router = express.Router();
router.use(i18n.init);
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name, phone, address, lat, lng, role, location } = req.body;
        console.log('Signup request received:', { email, name, role }); // Debug log

        if (!email || !password || !name) {
            return res.status(400).json({errorType: "email", message: res.__("email_password_name_required") });
        }

        if (process.env.DEMO_MODE === 'true') {
            return res.status(403).json({ message: res.__("demo_mode_action_not_available") });
        }

        if (role === 'admin') {
            const existingAdmin = await User.findOne({ role: 'admin' });
            if (existingAdmin) {
                return res.status(400).json({errorType: "email", message: res.__("admin_already_exists") });
            }
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({errorType: "email", message: res.__("email_already_in_use") });
        }
        const newUser = new User({
            email,
            password,
            name,
            phone: phone || '',
            address: address || '',
            location: location || {
                latitude: Number(lat) || 0,
                longitude: Number(lng) || 0,
            },
            role: role || 'customer'
        });
        await newUser.save();
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.json({
            message: res.__("user_registered_successfully"),
            token,
            user: {
                id: newUser._id,
                email: newUser.email,
                name: newUser.name,
                phone: newUser.phone,
                address: newUser.address,
                lat: newUser.location?.latitude || 0,
                lng: newUser.location?.longitude || 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: res.__("server_error") });
    }
});
const loginUser = async (req, res, allowedRole, accessDeniedKey) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = typeof email === 'string' ? email.trim() : email;
        if (!normalizedEmail || !password) {
            return res.status(400).json({ message: res.__("email_and_password_required") });
        }
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({errorType: "email", message: res.__("user_not_found") });
        }
        if (user.role !== allowedRole) {
            return res.status(403).json({
                message: res.__(accessDeniedKey)
            });
        }
        if (user.isActive === false) {
            return res.status(403).json({ message: res.__("account_disabled") });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({errorType: "password", message: res.__("incorrect_password") });
        }
        const token = jwt.sign({ id: user._id, type: user.role, restaurant: user.restaurant, isDemo: user.isDemo, isActive: user.isActive }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'Strict' });
        return res.json({ message: res.__("login_successful"), token, user });
    } catch (error) {
        res.status(500).json({ message: res.__("server_error") });
    }
};
router.post('/login', (req, res) => loginUser(req, res, "admin", "access_denied_admin_only"));
router.post('/customer-login', (req, res) => loginUser(req, res, "customer", "access_denied"));
router.post('/delivery-login', (req, res) => loginUser(req, res, "delivery", "access_denied"));
router.post('/restaurant-login', (req, res) => loginUser(req, res, "restaurant", "access_denied"));

router.use((req, res) => {
  res.status(404).json({ message: res.__('not_found') });
});

module.exports = router;
