const express = require('express');
const {
  recommendations,
  eta,
  surge,
  quote,
} = require('../controllers/intelligenceController');

const router = express.Router();

router.get('/recommendations', recommendations);
router.get('/eta', eta);
router.get('/surge', surge);
router.get('/quote', quote);

module.exports = router;
