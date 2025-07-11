const ArtisanReview = require('./../models/artisanReviewModel');
const factory = require('./handlerFactory');

exports.getAllArtisanReviews = factory.getAll(ArtisanReview, {
  path: 'user artisanShop service',
});
exports.getArtisanReview = factory.getOne(ArtisanReview, {
  path: 'user artisanShop service',
});
exports.createArtisanReview = factory.createOne(ArtisanReview);
exports.updateArtisanReview = factory.updateOne(ArtisanReview);
exports.deleteArtisanReview = factory.deleteOne(ArtisanReview);
