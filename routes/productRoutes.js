const express = require('express');
const productController = require('../controllers/productController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/search').get(productController.searchProduct);

router
  .route('/')
  .get(productController.getAllProducts)
  .post(
    authController.protect,
    authController.restrictTo('supplier'),
    productController.uploadProductImages,
    productController.createProduct
  )
  .delete(
    authController.protect,
    authController.restrictTo('supplier', 'admin'),
    productController.deleteProduct
  );

router.route('/:id').get(productController.getProduct);

router
  .route('/:id/review')
  .get(productController.getAllReviews)
  .post(authController.protect, productController.writeReview);

router.delete('/deleteimage', productController.deleteImage);

module.exports = router;
