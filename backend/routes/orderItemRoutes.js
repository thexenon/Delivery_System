const express = require('express');
const orderItemController = require('./../controllers/orderItemController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(orderItemController.getAllOrderItems)
  .post(
    authController.restrictTo('user'),
    orderItemController.setRequiredIds,
    orderItemController.createOrderItem,
  );

router
  .route('/:id')
  .get(orderItemController.getOrderItem)
  .patch(
    authController.restrictTo('user', 'rider', 'merchant'),
    orderItemController.updateOrderItem,
  )
  .delete(
    authController.restrictTo('user', 'admin', 'creator'),
    orderItemController.deleteOrderItem,
  );

module.exports = router;
