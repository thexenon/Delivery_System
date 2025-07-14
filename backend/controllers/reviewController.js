const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');

exports.getAllReviews = factory.getAll(Review, { path: 'user store product' });
exports.getReview = factory.getOne(Review, { path: 'user store product' });
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
