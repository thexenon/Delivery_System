const Product = require('./../models/productModel');
const factory = require('./handlerFactory');

exports.setRequiredIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.store) req.body.store = req.params.store.id;
  if (!req.body.category) req.body.category = req.params.category.id;
  next();
};

exports.getAllProducts = factory.getAll(Product, {
  path: 'category store reviews',
});
exports.getProduct = factory.getOne(Product, {
  path: 'category store reviews',
});
exports.createProduct = factory.createOne(Product);
exports.updateProduct = factory.updateOne(Product);
exports.deleteProduct = factory.deleteOne(Product);
