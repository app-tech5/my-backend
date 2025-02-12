const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const i18n = require('../config/i18n');

const router = express.Router();
router.use(i18n.init);

// Inscription
router.post('/signup', async (req, res) => {
    // req.setLocale('en');
    try {
        console.log("🔵 Requête reçue:", req.body);
        
        const { email, password, confirmPassword } = req.body;
        
        if (!email || !password) {
            console.log("🟠 Erreur: Email ou mot de passe manquant");
            return res.status(400).json({errorType: "email", message: res.__("email_and_password_required") });
        }
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("🟠 Utilisateur déjà existant:", email);
            return res.status(400).json({errorType: "email", message: res.__("email_already_in_use") });
        }
        
        if (password !== confirmPassword) {
            console.log("🟠 Erreur: Les mots de passe ne correspondent pas");
            return res.status(400).json({errorType: "password", message: res.__("passwords_do_not_match") });
        }
        
        console.log("🟢 Création d'un nouvel utilisateur:", email);
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("🔵 Mot de passe haché avec succès");
        
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();
        console.log("✅ Utilisateur enregistré avec succès:", newUser);
        
        return res.json({  success: true, message: res.__("user_registered_successfully") });
        
    } catch (error) {
        console.error("🔴 Erreur serveur:", error);
        res.status(500).json({ message: res.__("server_error") });
    }
});

router.post('/login', async (req, res) => {
    try {
        console.log("🔵 Requête de connexion reçue:", req.body);
        
        const { email, password } = req.body;
        
        if (!email || !password) {
            console.log("🟠 Erreur: Email ou mot de passe manquant");
            return res.status(400).json({ message: res.__("email_and_password_required") });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            console.log("🟠 Erreur: Utilisateur non trouvé");
            return res.status(400).json({errorType: "email", message: res.__("user_not_found") });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("🟠 Erreur: Mot de passe incorrect");
            return res.status(400).json({errorType: "password", message: res.__("incorrect_password") });
        }
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'Strict' });
        
        console.log("✅ Utilisateur connecté avec succès:", user.email);
        return res.json({ message: res.__("login_successful"), token, user });
        
    } catch (error) {
        console.error("🔴 Erreur serveur:", error);
        res.status(500).json({ message: res.__("server_error") });
    }
});

router.get('/me', async (req, res) => {
    try {
        // const token = req.cookies.token; // Récupère le token JWT dans les cookies
        // if (!token) return res.status(401).json({ message: res.__("unauthenticated") });

        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(req.user.id).select('-password'); // Exclut le mot de passe
        if (!user) return res.status(401).json({ message: res.__("user_not_found") });

        res.json(user);
    } catch (error) {
        res.status(401).json({ message: res.__("invalid_or_expired_token") });
    }
});

router.post("/logout", (req, res) => {
    res.clearCookie("token", { httpOnly: true, secure: false, sameSite: "Strict" });
    res.json({ message: res.__("logout_successful") });
});

module.exports = router;
