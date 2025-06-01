const Food = require('./../models/foodModel');
const factory = require('./handlerFactory');

exports.setRequiredIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.store) req.body.store = req.params.store.id;
  if (!req.body.category) req.body.category = req.params.category.id;
  next();
};

exports.getAllFoods = factory.getAll(Food);
exports.getFood = factory.getOne(Food);
exports.createFood = factory.createOne(Food);
exports.updateFood = factory.updateOne(Food);
exports.deleteFood = factory.deleteOne(Food);
