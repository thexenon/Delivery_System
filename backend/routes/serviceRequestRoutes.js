const express = require('express');
const serviceRequestController = require('./../controllers/serviceRequestController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(serviceRequestController.getAllServiceRequests)
  .post(
    authController.protect,
    authController.restrictTo('user', 'admin', 'superadmin', 'creator'),
    serviceRequestController.createServiceRequest,
  );

router
  .route('/:id')
  .get(serviceRequestController.getServiceRequest)
  .patch(
    authController.protect,
    authController.restrictTo(
      'user',
      'artisan',
      'admin',
      'superadmin',
      'creator',
    ),
    serviceRequestController.updateServiceRequest,
  )
  .delete(
    authController.protect,
    authController.restrictTo(
      'user',
      'artisan',
      'admin',
      'superadmin',
      'creator',
    ),
    serviceRequestController.deleteServiceRequest,
  );

module.exports = router;
