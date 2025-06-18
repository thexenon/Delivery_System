const express = require('express');
const orderItemController = require('./../controllers/orderItemController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(orderItemController.getAllOrderItems)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    orderItemController.setRequiredIds,
    orderItemController.createOrderItem,
  );

router
  .route('/:id')
  .get(orderItemController.getOrderItem)
  .patch(
    authController.protect,
    authController.restrictTo('user', 'rider', 'merchant'),
    orderItemController.updateOrderItem,
  )
  .delete(
    authController.protect,
    authController.restrictTo('user', 'admin', 'creator'),
    orderItemController.deleteOrderItem,
  );

module.exports = router;
