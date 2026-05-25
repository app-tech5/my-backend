const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const i18n = require('../config/i18n');
const router = express.Router();
router.use(i18n.init);
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name, phone, address, lat, lng, role } = req.body;
        console.log('Signup request received:', { email, name, role }); // Debug log

        if (!email || !password || !name) {
            return res.status(400).json({errorType: "email", message: res.__("email_password_name_required") });
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
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            email,
            password: hashedPassword,
            name,
            phone: phone || '',
            address: address || '',
            lat: lat || 0,
            lng: lng || 0,
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
                lat: newUser.lat,
                lng: newUser.lng
            }
        });
    } catch (error) {
        res.status(500).json({ message: res.__("server_error") });
    }
});
const loginUser = async (req, res, allowedRole, accessDeniedKey) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: res.__("email_and_password_required") });
        }
        const user = await User.findOne({ email });
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
router.post('/delivery-login', (req, res) => loginUser(req, res, "delivery", "access_denied"));
module.exports = router;
