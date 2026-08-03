const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');

const router = express.Router();

router.get('/', subscriptionController.listPlans);
router.get('/mine', subscriptionController.getMine);
router.get('/mine/benefits', subscriptionController.getBenefits);
router.post('/:id/subscribe', subscriptionController.subscribe);
router.post('/mine/cancel', subscriptionController.cancelMine);

module.exports = router;
