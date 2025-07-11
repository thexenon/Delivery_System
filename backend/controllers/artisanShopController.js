const ArtisanShop = require('./../models/artisanShopModel');
const factory = require('./handlerFactory');

exports.getAllArtisanShops = factory.getAll(ArtisanShop, {
  path: 'artisan services reviews',
});
exports.getArtisanShop = factory.getOne(ArtisanShop, {
  path: 'artisan services reviews',
});
exports.createArtisanShop = factory.createOne(ArtisanShop);
exports.updateArtisanShop = factory.updateOne(ArtisanShop);
exports.deleteArtisanShop = factory.deleteOne(ArtisanShop);
