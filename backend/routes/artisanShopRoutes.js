const express = require('express');
const artisanShopController = require('./../controllers/artisanShopController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(artisanShopController.getAllArtisanShops)
  .post(
    authController.protect,
    authController.restrictTo('artisan', 'admin', 'superadmin', 'creator'),
    artisanShopController.createArtisanShop,
  );

router
  .route('/:id')
  .get(artisanShopController.getArtisanShop)
  .patch(
    authController.protect,
    authController.restrictTo('artisan', 'admin', 'superadmin', 'creator'),
    artisanShopController.updateArtisanShop,
  )
  .delete(
    authController.protect,
    authController.restrictTo('artisan', 'admin', 'superadmin', 'creator'),
    artisanShopController.deleteArtisanShop,
  );

module.exports = router;
