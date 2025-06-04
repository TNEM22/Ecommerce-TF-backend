const express = require('express');
const authController = require('../controllers/authController');
const orderController = require('../controllers/orderController');

const router = express.Router();

router.use(authController.protect);

router.get('/payment/:paymentId', orderController.getPayment);
router.post('/create', orderController.createOrder);
router.post('/verify', orderController.verifyPayment);

module.exports = router;
