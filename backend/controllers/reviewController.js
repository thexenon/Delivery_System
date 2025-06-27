const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');

exports.setRequiredIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.store) req.body.store = req.params.store.id;
  if (!req.body.product) req.body.product = req.params.product.id;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review, { path: 'user store product' });
exports.getReview = factory.getOne(Review, { path: 'user store product' });
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
