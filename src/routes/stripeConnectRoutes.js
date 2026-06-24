const express = require('express');
const stripeConnectController = require('../controllers/stripeConnectController');

const router = express.Router();

router.post('/onboarding', stripeConnectController.startOnboarding);
router.get('/status', stripeConnectController.getStatus);
router.post('/sync', stripeConnectController.syncPayoutMethod);
router.post('/transfer', stripeConnectController.createTransfer);

module.exports = router;
