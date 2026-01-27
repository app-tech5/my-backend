const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PaymentMethod = require('../models/PaymentMethod');
const i18n = require('../config/i18n');

const router = express.Router();
router.use(i18n.init);

// Inscription
router.post('/signup', async (req, res) => {
    // req.setLocale('en');
    // try {
    //     console.log("🔵 Requête reçue:", req.body);
        
    //     const { email, password, confirmPassword } = req.body;
        
    //     if (!email || !password) {
    //         console.log("🟠 Erreur: Email ou mot de passe manquant");
    //         return res.status(400).json({errorType: "email", message: res.__("email_and_password_required") });
    //     }
        
    //     const existingUser = await User.findOne({ email });
    //     if (existingUser) {
    //         console.log("🟠 Utilisateur déjà existant:", email);
    //         return res.status(400).json({errorType: "email", message: res.__("email_already_in_use") });
    //     }
        
    //     if (password !== confirmPassword) {
    //         console.log("🟠 Erreur: Les mots de passe ne correspondent pas");
    //         return res.status(400).json({errorType: "password", message: res.__("passwords_do_not_match") });
    //     }
        
    //     console.log("🟢 Création d'un nouvel utilisateur:", email);
    //     const hashedPassword = await bcrypt.hash(password, 10);
    //     console.log("🔵 Mot de passe haché avec succès");
        
    //     const newUser = new User({ email, password: hashedPassword });
    //     await newUser.save();
    //     console.log("✅ Utilisateur enregistré avec succès:", newUser);
        
    //     return res.json({  success: true, message: res.__("user_registered_successfully") });
        
    // } catch (error) {
    //     console.error("🔴 Erreur serveur:", error);
    //     res.status(500).json({ message: res.__("server_error") });
    // }
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


router.put('/me', async (req, res) => {
    try {
        // Récupère l'utilisateur courant (via le middleware d'authentification)
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(401).json({ message: res.__("user_not_found") });
        }

        // Met à jour uniquement les champs autorisés
        const { name, phone, address, image } = req.body;
        
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (image) user.image = image;

        // Sauvegarde les modifications
        const updatedUser = await user.save();

        // Retourne l'utilisateur sans le mot de passe
        const userWithoutPassword = updatedUser.toObject();
        delete userWithoutPassword.password;

        res.json(userWithoutPassword);

    } catch (error) {
        console.error('Update error:', error);
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

// GESTION DES FAVORIS

// Ajouter un restaurant aux favoris
router.post('/favorites/:restaurantId', async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: res.__("user_not_found") });
        }

        const restaurantId = req.params.restaurantId;

        // Vérifier si déjà dans les favoris
        if (user.favorites.includes(restaurantId)) {
            return res.status(400).json({ message: "Restaurant already in favorites" });
        }

        // Ajouter aux favoris
        user.favorites.push(restaurantId);
        await user.save();

        // Retourner la liste mise à jour
        const updatedUser = await User.findById(req.user.id).populate('favorites');
        res.json({
            success: true,
            favorites: updatedUser.favorites,
            message: "Restaurant added to favorites"
        });

    } catch (error) {
        console.error('Add to favorites error:', error);
        res.status(500).json({ message: res.__("server_error") });
    }
});

// Retirer un restaurant des favoris
router.delete('/favorites/:restaurantId', async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: res.__("user_not_found") });
        }

        const restaurantId = req.params.restaurantId;

        // Retirer des favoris
        user.favorites = user.favorites.filter(id => id.toString() !== restaurantId);
        await user.save();

        // Retourner la liste mise à jour
        const updatedUser = await User.findById(req.user.id).populate('favorites');
        res.json({
            success: true,
            favorites: updatedUser.favorites,
            message: "Restaurant removed from favorites"
        });

    } catch (error) {
        console.error('Remove from favorites error:', error);
        res.status(500).json({ message: res.__("server_error") });
    }
});

// Récupérer les favoris de l'utilisateur
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
        console.error('Get favorites error:', error);
        res.status(500).json({ message: res.__("server_error") });
    }
});

// GESTION DES ADRESSES

// Récupérer les adresses de l'utilisateur
router.get('/:userId/addresses', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Vérifier que l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Pour l'instant, retourner seulement l'adresse principale de l'utilisateur
        // TODO: Implémenter un modèle Address séparé si nécessaire
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
        console.error('Get addresses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GESTION DES MÉTHODES DE PAIEMENT

// Récupérer les méthodes de paiement de l'utilisateur
router.get('/:userId/payment-methods', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Vérifier que l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Récupérer les méthodes de paiement de l'utilisateur
        const paymentMethods = await PaymentMethod.find({ user: userId, isActive: true });

        res.json(paymentMethods);

    } catch (error) {
        console.error('Get payment methods error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Ajouter une méthode de paiement
router.post('/:userId/payment-methods', async (req, res) => {
    try {
        const userId = req.params.userId;
        const paymentData = req.body;

        // Vérifier que l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Si c'est la méthode par défaut, désactiver les autres
        if (paymentData.isDefault) {
            await PaymentMethod.updateMany(
                { user: userId },
                { $set: { isDefault: false } }
            );
        }

        // Créer la nouvelle méthode de paiement
        const paymentMethod = new PaymentMethod({
            ...paymentData,
            user: userId
        });

        await paymentMethod.save();

        res.status(201).json({
            success: true,
            paymentMethod,
            message: 'Payment method added successfully'
        });

    } catch (error) {
        console.error('Add payment method error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Supprimer une méthode de paiement
router.delete('/:userId/payment-methods/:paymentMethodId', async (req, res) => {
    try {
        const { userId, paymentMethodId } = req.params;

        // Vérifier que l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Supprimer la méthode de paiement
        const paymentMethod = await PaymentMethod.findOneAndDelete({
            _id: paymentMethodId,
            user: userId
        });

        if (!paymentMethod) {
            return res.status(404).json({ message: 'Payment method not found' });
        }

        res.json({
            success: true,
            message: 'Payment method deleted successfully'
        });

    } catch (error) {
        console.error('Delete payment method error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Définir une méthode de paiement par défaut
router.put('/:userId/payment-methods/:paymentMethodId/default', async (req, res) => {
    try {
        const { userId, paymentMethodId } = req.params;

        // Vérifier que l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Désactiver toutes les méthodes par défaut
        await PaymentMethod.updateMany(
            { user: userId },
            { $set: { isDefault: false } }
        );

        // Activer la méthode sélectionnée comme défaut
        const paymentMethod = await PaymentMethod.findOneAndUpdate(
            { _id: paymentMethodId, user: userId },
            { $set: { isDefault: true } },
            { new: true }
        );

        if (!paymentMethod) {
            return res.status(404).json({ message: 'Payment method not found' });
        }

        res.json({
            success: true,
            paymentMethod,
            message: 'Payment method set as default successfully'
        });

    } catch (error) {
        console.error('Set default payment method error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Récupérer un utilisateur par ID
// ⚠️ Cette route doit être LA DERNIÈRE car elle capture tous les /:id
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password'); // Exclut le mot de passe
        if (!user) {
            console.log("🟠 Utilisateur non trouvé:", req.params.id);
            return res.status(404).json({ message: res.__("user_not_found") });
        }

        console.log("✅ Utilisateur trouvé:", user.email);
        res.json(user);
    } catch (error) {
        console.error("🔴 Erreur lors de la récupération de l'utilisateur:", error);
        res.status(500).json({ message: res.__("server_error") });
    }
});

module.exports = router;
