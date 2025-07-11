const express = require('express');
const serviceController = require('./../controllers/serviceController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(serviceController.getAllServices)
  .post(
    authController.protect,
    authController.restrictTo('artisan', 'admin', 'superadmin', 'creator'),
    serviceController.createService,
  );

router
  .route('/:id')
  .get(serviceController.getService)
  .patch(
    authController.protect,
    authController.restrictTo('artisan', 'admin', 'superadmin', 'creator'),
    serviceController.updateService,
  )
  .delete(
    authController.protect,
    authController.restrictTo('artisan', 'admin', 'superadmin', 'creator'),
    serviceController.deleteService,
  );

module.exports = router;
