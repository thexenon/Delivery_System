const express = require('express');
const orderController = require('./../controllers/orderController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(orderController.getAllOrders)
  .post(
    authController.protect,
    authController.restrictTo('user', 'admin', 'superadmin', 'creator'),
    orderController.setRequiredIds,
    orderController.createOrder,
  );

router
  .route('/:id')
  .get(orderController.getOrder)
  .patch(
    authController.protect,
    authController.restrictTo(
      'user',
      'rider',
      'merchant',
      'admin',
      'superadmin',
      'creator',
    ),
    orderController.updateOrder,
  )
  .delete(
    authController.protect,
    authController.restrictTo('user', 'admin', 'superadmin', 'creator'),
    orderController.deleteOrder,
  );

module.exports = router;
