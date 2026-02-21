const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const i18n = require('../config/i18n');
const router = express.Router();
router.use(i18n.init);
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name, phone, address, lat, lng } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({errorType: "email", message: "Email, password et name sont requis" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({errorType: "email", message: "Email déjà utilisé" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            email,
            password: hashedPassword,
            name,
            phone: phone || '',
            address: address || '',
            lat: lat || 0,
            lng: lng || 0
        });
        await newUser.save();
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.json({
            message: "Utilisateur enregistré avec succès",
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
        console.error("🔴 Erreur serveur:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
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
        const token = jwt.sign({ id: user._id, type: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'Strict' });
        return res.json({ message: res.__("login_successful"), token, user });
    } catch (error) {
        console.error("🔴 Erreur serveur:", error);
        res.status(500).json({ message: res.__("server_error") });
    }
});
module.exports = router;
