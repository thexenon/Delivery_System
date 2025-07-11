const Favorite = require('./../models/reviewModel');
const factory = require('./handlerFactory');

exports.getAllFavorites = factory.getAll(Favorite, {
  path: 'user stores products',
});
exports.getFavorite = factory.getOne(Favorite, {
  path: 'user stores products',
});
exports.createFavorite = factory.createOne(Favorite);
exports.updateFavorite = factory.updateOne(Favorite);
exports.deleteFavorite = factory.deleteOne(Favorite);
exports.updateFavorites = factory.updateFavorites(Favorite);
