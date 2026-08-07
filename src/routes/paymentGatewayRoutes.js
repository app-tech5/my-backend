const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentGatewayController');

router.get('/providers', ctrl.listProviders);
router.post('/initialize', ctrl.initialize);

module.exports = router;
