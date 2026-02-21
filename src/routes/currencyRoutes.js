const express = require('express');
const router = express.Router();
const Currency = require('../models/Currency');
router.get('/', async (req, res) => {
    try {
        console.log("Début de la requête GET /"); 
        const currencies = await Currency.find();
        console.log("Résultat de la requête Currency.find() :", currencies); 
        if (!currencies) {
            console.log("Aucune devise trouvée."); 
        } else if (currencies.length === 0) {
            console.log("Tableau de devises vide."); 
        }
        res.json(currencies);
        console.log("Réponse envoyée avec succès."); 
    } catch (error) {
        console.error("Erreur lors de la requête GET / :", error); 
        res.status(500).json({ message: 'Erreur serveur', error: error.message }); 
    }
});
router.get('/:id', async (req, res) => {
    try {
        const currency = await Currency.findById(req.params.id);
        if (!currency) {
            return res.status(404).json({ message: 'Devise non trouvée' });
        }
        res.json(currency);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
});
router.post('/', async (req, res) => {
    const { code, name, exchangeRate, symbol } = req.body;
    if (!code || !name || !exchangeRate || !symbol) {
        return res.status(400).json({ message: 'Données incomplètes' });
    }
    try {
        const newCurrency = new Currency({ code: code.toUpperCase(), name, exchangeRate, symbol });
        await newCurrency.save();
        res.status(201).json({ message: 'Devise ajoutée', currency: newCurrency });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
});
router.put('/:id', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Nom de la devise requis' });
    }
    try {
        const updatedCurrency = await Currency.findByIdAndUpdate(req.params.id, { name }, { new: true });
        if (!updatedCurrency) {
            return res.status(404).json({ message: 'Devise non trouvée' });
        }
        res.json({ message: 'Devise mise à jour', currency: updatedCurrency });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const deletedCurrency = await Currency.findByIdAndDelete(req.params.id);
        if (!deletedCurrency) {
            return res.status(404).json({ message: 'Devise non trouvée' });
        }
        res.json({ message: 'Devise supprimée' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
});
module.exports = router;
