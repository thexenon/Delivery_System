const express = require('express');
const artisanReviewController = require('./../controllers/artisanReviewController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(artisanReviewController.getAllArtisanReviews)
  .post(
    authController.protect,
    authController.restrictTo('user', 'admin', 'superadmin', 'creator'),
    artisanReviewController.createArtisanReview,
  );

router
  .route('/:id')
  .get(artisanReviewController.getArtisanReview)
  .patch(
    authController.protect,
    authController.restrictTo('user', 'admin', 'superadmin', 'creator'),
    artisanReviewController.updateArtisanReview,
  )
  .delete(
    authController.protect,
    authController.restrictTo('user', 'admin', 'superadmin', 'creator'),
    artisanReviewController.deleteArtisanReview,
  );

module.exports = router;
