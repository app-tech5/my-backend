const express = require('express');
const router = express.Router();
const Currency = require('../models/Currency');
const i18n = require('../config/i18n');
router.use(i18n.init);
router.get('/', async (req, res) => {
  try {
    const currencies = await Currency.find();
    if (!currencies) {
    } else if (currencies.length === 0) {
    }
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ message: res.__('server_error'), error: error.message });
  }
});
router.get('/:id', async (req, res) => {
  try {
    const currency = await Currency.findById(req.params.id);
    if (!currency) {
      return res.status(404).json({ message: res.__('currency_not_found') });
    }
    res.json(currency);
  } catch (error) {
    res.status(500).json({ message: res.__('server_error'), error });
  }
});
router.post('/', async (req, res) => {
  const { code, name, exchangeRate, symbol } = req.body;
  if (!code || !name || !exchangeRate || !symbol) {
    return res.status(400).json({ message: res.__('incomplete_data') });
  }
  try {
    const newCurrency = new Currency({ code: code.toUpperCase(), name, exchangeRate, symbol });
    await newCurrency.save();
    res.status(201).json({ message: res.__('currency_added'), currency: newCurrency });
  } catch (error) {
    res.status(500).json({ message: res.__('server_error'), error });
  }
});
router.put('/:id', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: res.__('currency_name_required') });
  }
  try {
    const updatedCurrency = await Currency.findByIdAndUpdate(req.params.id, { name }, { new: true });
    if (!updatedCurrency) {
      return res.status(404).json({ message: res.__('currency_not_found') });
    }
    res.json({ message: res.__('currency_updated'), currency: updatedCurrency });
  } catch (error) {
    res.status(500).json({ message: res.__('server_error'), error });
  }
});
router.delete('/:id', async (req, res) => {
  try {
    const deletedCurrency = await Currency.findByIdAndDelete(req.params.id);
    if (!deletedCurrency) {
      return res.status(404).json({ message: res.__('currency_not_found') });
    }
    res.json({ message: res.__('currency_deleted') });
  } catch (error) {
    res.status(500).json({ message: res.__('server_error'), error });
  }
});
module.exports = router;
