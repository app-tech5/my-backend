const express = require('express');
const stripePaymentController = require('../controllers/stripePaymentController');

const router = express.Router();

router.post('/stripe/attach-payment-method', stripePaymentController.attachPaymentMethodToCustomer);
router.post('/stripe/payment-intent', stripePaymentController.createPaymentIntent);
router.post('/stripe/remove-payment-method', stripePaymentController.removePaymentMethod);

module.exports = router;
