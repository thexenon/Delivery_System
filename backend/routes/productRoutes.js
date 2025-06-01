const express = require('express');
const productController = require('./../controllers/productController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(productController.getAllProducts)
  .post(
    authController.restrictTo('merchant'),
    productController.setRequiredIds,
    productController.createProduct,
  );

router
  .route('/:id')
  .get(productController.getProduct)
  .patch(authController.restrictTo('merchant'), productController.updateProduct)
  .delete(
    authController.restrictTo('merchant', 'admin', 'creator'),
    productController.deleteProduct,
  );

module.exports = router;
