const express = require('express');
const orderController = require('./../controllers/orderController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(orderController.getAllOrders)
  .post(
    authController.restrictTo('user'),
    orderController.setRequiredIds,
    orderController.createOrder,
  );

router
  .route('/:id')
  .get(orderController.getOrder)
  .patch(
    authController.restrictTo('user', 'rider', 'merchant'),
    orderController.updateOrder,
  )
  .delete(
    authController.restrictTo('user', 'admin', 'creator'),
    orderController.deleteOrder,
  );

module.exports = router;
