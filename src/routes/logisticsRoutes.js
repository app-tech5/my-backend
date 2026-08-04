const express = require('express');
const {
  batchSuggestions,
  acceptBatch,
  activeOrders,
  completeWithProof,
} = require('../controllers/logisticsController');

const router = express.Router();

router.get('/orders/:orderId/batch-suggestions', batchSuggestions);
router.post('/orders/:orderId/accept-batch', acceptBatch);
router.get('/drivers/:driverId/active-orders', activeOrders);
router.post('/orders/:orderId/complete', completeWithProof);

module.exports = router;
