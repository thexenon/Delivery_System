const express = require('express');
const storeController = require('./../controllers/storeController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(storeController.getAllStores)
  .post(
    authController.restrictTo('merchant'),
    storeController.setRequiredIds,
    storeController.createStore,
  );

router
  .route('/:id')
  .get(storeController.getStore)
  .patch(authController.restrictTo('merchant'), storeController.updateStore)
  .delete(
    authController.restrictTo('merchant', 'admin', 'creator'),
    storeController.deleteStore,
  );

module.exports = router;
