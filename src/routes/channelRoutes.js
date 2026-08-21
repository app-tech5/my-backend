const express = require('express');
const publicRouter = express.Router();
const protectedRouter = express.Router();
const ctrl = require('../controllers/channelController');

publicRouter.post('/ussd', ctrl.ussdWebhook);
publicRouter.get('/whatsapp', ctrl.whatsappWebhookVerify);
publicRouter.post('/whatsapp', ctrl.whatsappWebhook);

protectedRouter.get('/config', ctrl.getConfig);
protectedRouter.post('/orders', ctrl.createOrder);
protectedRouter.post('/whatsapp/test', ctrl.testWhatsApp);

module.exports = { publicRouter, protectedRouter };
