const express = require('express');
const categoryController = require('./../controllers/categoryController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(categoryController.getAllCategorys)
  .post(authController.restrictTo('admin'), categoryController.createCategory);

router
  .route('/:id')
  .get(categoryController.getCategory)
  .patch(authController.restrictTo('admin'), categoryController.updateCategory)
  .delete(
    authController.restrictTo('admin', 'creator'),
    categoryController.deleteCategory,
  );

module.exports = router;
