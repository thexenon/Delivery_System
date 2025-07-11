const express = require('express');
const favoriteController = require('./../controllers/favoriteController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(favoriteController.getAllFavorites)
  .post(
    authController.protect,
    authController.restrictTo('user', 'superadmin', 'creator'),
    favoriteController.createFavorite,
  );

router
  .route('/:id')
  .get(favoriteController.getFavorite)
  .patch(
    authController.protect,
    authController.restrictTo('user', 'superadmin', 'creator'),
    favoriteController.updateFavorites,
  )
  .put(
    authController.protect,
    authController.restrictTo('user', 'superadmin', 'creator'),
    favoriteController.updateFavorite,
  )
  .delete(
    authController.protect,
    authController.restrictTo('user', 'admin', 'superadmin', 'creator'),
    favoriteController.deleteFavorite,
  );

module.exports = router;
