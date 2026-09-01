const express = require('express');
const { createLicenseInquiry } = require('../controllers/marketingController');

const router = express.Router();

router.post('/license-inquiry', createLicenseInquiry);

module.exports = router;
