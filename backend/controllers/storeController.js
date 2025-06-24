const Store = require('./../models/storeModel');
const factory = require('./handlerFactory');

exports.setRequiredIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.merchant) req.body.merchant = req.user.id;
  next();
};

exports.getAllStores = factory.getAll(Store, {
  path: 'owner reviews products',
});
exports.getStore = factory.getOne(Store, {
  path: 'owner reviews products',
});
exports.createStore = factory.createOne(Store);
exports.updateStore = factory.updateOne(Store);
exports.deleteStore = factory.deleteOne(Store);
