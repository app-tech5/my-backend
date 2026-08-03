const express = require('express');
const orderChatController = require('../controllers/orderChatController');

const router = express.Router({ mergeParams: true });

router.get('/', orderChatController.getMessages);
router.post('/', orderChatController.postMessage);

module.exports = router;
