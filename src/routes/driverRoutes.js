const express = require('express');
const jwt = require('jsonwebtoken');
const Driver = require('../models/Driver');
const User = require('../models/User');
const i18n = require('../config/i18n');
const router = express.Router();
router.use(i18n.init);
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  if (!token) {
    return res.status(401).json({ message: res.__('missing_token') });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: res.__('invalid_token') });
    }
    req.user = user;
    next();
  });
};
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id })
      .populate('userId', 'name email phone image');
    if (!driver) {
      return res.status(404).json({
        message: res.__('driver_profile_not_found'),
        errorType: 'profile_not_found'
      });
    }
    res.json(driver);
  } catch (error) {
    console.error(i18n.__('driver_profile_retrieval_error'), error);
    res.status(500).json({ message: res.__('server_error') });
  }
});
router.post('/', authenticateToken, async (req, res) => {
  try {
    const existingDriver = await Driver.findOne({ userId: req.user.id });
    if (existingDriver) {
      return res.status(400).json({
        message: res.__('driver_profile_already_exists'),
        errorType: 'profile_exists'
      });
    }
    const { licenseNumber, vehicle } = req.body;
    if (!licenseNumber) {
      return res.status(400).json({
        message: res.__('license_number_required'),
        errorType: 'license_required'
      });
    }
    const newDriver = new Driver({
      userId: req.user.id,
      licenseNumber,
      vehicle: vehicle || {},
      status: 'offline',
      location: {
        type: 'Point',
        coordinates: [0, 0] 
      }
    });
    await newDriver.save();
    await newDriver.populate('userId', 'name email phone');
    res.status(201).json(newDriver);
  } catch (error) {
    console.error(i18n.__('driver_profile_creation_error'), error);
    res.status(500).json({ message: res.__('server_error') });
  }
});
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.userId;
    const driver = await Driver.findOneAndUpdate(
      { userId: req.user.id },
      updates,
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone image');
    if (!driver) {
      return res.status(404).json({ message: res.__('driver_profile_not_found') });
    }
    res.json(driver);
  } catch (error) {
    console.error(i18n.__('driver_profile_update_error'), error);
    res.status(500).json({ message: res.__('server_error') });
  }
});
router.put('/status', authenticateToken, async (req, res) => {
  try {
    const { status, location } = req.body;
    const updateData = { status };
    if (location) {
      updateData.location = {
        type: 'Point',
        coordinates: [location.longitude || 0, location.latitude || 0]
      };
    }
    const driver = await Driver.findOneAndUpdate(
      { userId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone image');
    if (!driver) {
      return res.status(404).json({ message: res.__('driver_profile_not_found') });
    }
    res.json(driver);
  } catch (error) {
    console.error(i18n.__('driver_status_update_error'), error);
    res.status(500).json({ message: res.__('server_error') });
  }
});
module.exports = router;
