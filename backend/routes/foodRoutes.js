const express = require('express');
const foodController = require('./../controllers/foodController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(foodController.getAllFoods)
  .post(
    authController.restrictTo('merchant'),
    foodController.setRequiredIds,
    foodController.createFood,
  );

router
  .route('/:id')
  .get(foodController.getFood)
  .patch(authController.restrictTo('merchant'), foodController.updateFood)
  .delete(
    authController.restrictTo('merchant', 'admin', 'creator'),
    foodController.deleteFood,
  );

module.exports = router;
