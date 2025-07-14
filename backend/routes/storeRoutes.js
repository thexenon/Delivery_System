const express = require('express');
const storeController = require('./../controllers/storeController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(storeController.getAllStores)
  .post(
    authController.protect,
    authController.restrictTo('merchant', 'admin', 'superadmin', 'creator'),
    storeController.createStore,
  );

router
  .route('/:id')
  .get(storeController.getStore)
  .patch(
    authController.protect,
    authController.restrictTo('merchant', 'admin', 'superadmin', 'creator'),
    storeController.updateStore,
  )
  .delete(
    authController.protect,
    authController.restrictTo('merchant', 'admin', 'superadmin', 'creator'),
    storeController.deleteStore,
  );

module.exports = router;
