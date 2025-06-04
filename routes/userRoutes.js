const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup/otp', authController.checkOTP);
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

router.use(authController.protect);

router
  .route('/')
  .get(authController.restrictTo('admin'), userController.getAllUsers)
  .post(userController.createUser);

router.route('/me').post(userController.getMe);
router.route('/update').patch(userController.updateUser);

router.post('/cart', userController.getCartItemsCount);
router.post('/cart/add', userController.addCartItem);
router.post('/cart/delete', userController.deleteCartItem);
router.post('/cart/empty', userController.emptyCart);

module.exports = router;
