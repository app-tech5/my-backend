const express = require('express');
const controller = require('../controllers/sponsoredListingController');

const router = express.Router();

router.get('/active', controller.getActive);
router.get('/mine', controller.listMine);
router.post('/mine', controller.createMine);
router.post('/mine/:id/activate', controller.activateMine);
router.post('/:id/track', controller.track);
router.get('/:id', controller.getById);

module.exports = router;
