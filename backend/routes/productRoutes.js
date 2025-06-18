const express = require('express');
const productController = require('./../controllers/productController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(productController.getAllProducts)
  .post(
    authController.protect,
    authController.restrictTo('merchant', 'admin', 'superadmin', 'creator'),
    productController.setRequiredIds,
    productController.createProduct,
  );

router
  .route('/:id')
  .get(productController.getProduct)
  .patch(
    authController.protect,
    authController.restrictTo('merchant', 'admin', 'superadmin', 'creator'),
    productController.updateProduct,
  )
  .delete(
    authController.protect,
    authController.restrictTo('merchant', 'admin', 'superadmin', 'creator'),
    productController.deleteProduct,
  );

module.exports = router;
